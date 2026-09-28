import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { callAiModel, isAiModelAvailable } from '../lib/aiClient';

export const parseLogRouter = Router();

// ═══════════════════════════════════════════════════════════════════
// DETERMINISTIC PARSER REGISTRY — instant, free, no AI needed
// These handle known log formats. Add more patterns as you onboard
// new device types (or promote them from the UI).
// ═══════════════════════════════════════════════════════════════════

interface ParserMatch {
  class_uid: number;
  category_uid: number;
  severity_id: number;
  vendor_name: string;
  product_name: string;
}

const REGISTRY_PARSERS: Array<{ pattern: RegExp; match: ParserMatch }> = [
  {
    pattern: /sshd\[\d+\]/,
    match: {
      class_uid: 3002, category_uid: 3, severity_id: 3,
      vendor_name: 'Linux OpenSSH', product_name: 'OpenSSH sshd',
    },
  },
  {
    pattern: /%ASA-/,
    match: {
      class_uid: 4001, category_uid: 4, severity_id: 3,
      vendor_name: 'Cisco Systems', product_name: 'Cisco ASA Firewall',
    },
  },
  {
    pattern: /IAMUser|amazonaws\.com/,
    match: {
      class_uid: 6001, category_uid: 6, severity_id: 4,
      vendor_name: 'Amazon Web Services', product_name: 'AWS CloudTrail',
    },
  },
  {
    pattern: /Microsoft-Windows-Security/,
    match: {
      class_uid: 3002, category_uid: 3, severity_id: 3,
      vendor_name: 'Microsoft', product_name: 'Windows Security Auditing',
    },
  },
  {
    pattern: /^CEF:/,
    match: {
      class_uid: 2001, category_uid: 2, severity_id: 5,
      vendor_name: 'CEF Security', product_name: 'CEF Log Parser',
    },
  },
  {
    pattern: /"kind":"Event"/,
    match: {
      class_uid: 1007, category_uid: 1, severity_id: 4,
      vendor_name: 'Kubernetes', product_name: 'Kubernetes Engine',
    },
  },
];

/**
 * Try to match a raw log against the deterministic registry.
 * Returns the match or null if no pattern matches.
 */
function tryRegistryMatch(rawLog: string): ParserMatch | null {
  // Also check DB-stored rules (promoted from AI) at runtime
  for (const parser of REGISTRY_PARSERS) {
    if (parser.pattern.test(rawLog)) {
      return parser.match;
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// POST /parse_log — the main parsing endpoint
// Flow: Registry match → instant response
//       No match       → call AI model → validate → retry → respond
// ═══════════════════════════════════════════════════════════════════

parseLogRouter.post('/parse_log', async (req: Request, res: Response) => {
  try {
    const { raw_log } = req.body;
    if (!raw_log) {
      return res.status(400).json({ error: 'raw_log is required' });
    }

    // ─── Step 1: Try deterministic registry (instant, free) ───
    const registryMatch = tryRegistryMatch(raw_log);

    if (registryMatch) {
      const eventUid = `evt-ocsf-${Math.floor(1000 + Math.random() * 9000)}`;
      const ocsf_event = {
        class_uid: registryMatch.class_uid,
        category_uid: registryMatch.category_uid,
        severity_id: registryMatch.severity_id,
        time: new Date().toISOString(),
        metadata: {
          uid: eventUid,
          original_format: 'deterministic_registry' as const,
          vendor_name: registryMatch.vendor_name,
          product_name: registryMatch.product_name,
        },
        unmapped: {
          raw_length: raw_log.length,
          parsed_at: new Date().toISOString(),
          parser_engine: 'ULPF-Registry-v1.0',
        },
      };

      // Persist to DB as resolved
      await prisma.quarantineLog.create({
        data: {
          rawLog: raw_log,
          source: extractSource(raw_log),
          status: 'AI_RESOLVED',
          attempts: 0,
          ocsfEvent: ocsf_event,
        },
      });

      return res.json({
        status: 'parsed',
        attempts: 0,
        ocsf_event,
      });
    }

    // ─── Step 2: No registry match → call AI model ───
    console.log(`[parse_log] No registry match for log, sending to AI model...`);

    const aiResult = await callAiModel(raw_log);

    if (aiResult.success && aiResult.ocsf_event) {
      // AI succeeded — save as ai_resolved
      await prisma.quarantineLog.create({
        data: {
          rawLog: raw_log,
          source: extractSource(raw_log),
          status: 'AI_RESOLVED',
          attempts: aiResult.attempts,
          ocsfEvent: aiResult.ocsf_event as any,
        },
      });

      return res.json({
        status: 'parsed',
        attempts: aiResult.attempts,
        ocsf_event: aiResult.ocsf_event,
      });
    }

    // AI failed after all retries — quarantine the log
    await prisma.quarantineLog.create({
      data: {
        rawLog: raw_log,
        source: extractSource(raw_log),
        status: 'NEEDS_REVIEW',
        attempts: aiResult.attempts,
        error: aiResult.error,
      },
    });

    return res.json({
      status: 'quarantined',
      attempts: aiResult.attempts,
      raw_log,
      error: aiResult.error,
    });
  } catch (error) {
    console.error('Error parsing log:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Health check for AI model availability ───
parseLogRouter.get('/parse_log/status', async (_req: Request, res: Response) => {
  const aiAvailable = await isAiModelAvailable();
  res.json({
    registry_parsers: REGISTRY_PARSERS.length,
    ai_model_available: aiAvailable,
    ai_model_url: process.env.AI_MODEL_URL || 'http://localhost:5000/parse',
  });
});

/**
 * Attempt to extract a source IP or hostname from raw log text.
 */
function extractSource(raw_log: string): string {
  const ipMatch = raw_log.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
  if (ipMatch) return ipMatch[1];

  const hostMatch = raw_log.match(/([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)\s/);
  if (hostMatch) return hostMatch[1];

  return 'Unknown';
}
