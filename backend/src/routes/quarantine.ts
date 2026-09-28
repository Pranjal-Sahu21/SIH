import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { computeSHA256, computeMerkleRoot, generateSignature } from '../lib/hash';

export const quarantineRouter = Router();

export type LogStatus = 'unprocessed' | 'ai_resolved' | 'needs_review' | 'approved';

const STATUS_MAP: Record<string, 'UNPROCESSED' | 'AI_RESOLVED' | 'NEEDS_REVIEW' | 'APPROVED'> = {
  'unprocessed': 'UNPROCESSED',
  'ai_resolved': 'AI_RESOLVED',
  'needs_review': 'NEEDS_REVIEW',
  'approved': 'APPROVED',
};

const REVERSE_STATUS_MAP: Record<string, LogStatus> = {
  'UNPROCESSED': 'unprocessed',
  'AI_RESOLVED': 'ai_resolved',
  'NEEDS_REVIEW': 'needs_review',
  'APPROVED': 'approved',
};

function mapLogToResponse(log: any) {
  return {
    id: log.id,
    timestamp: log.timestamp.toISOString(),
    source: log.source,
    raw_log: log.rawLog,
    status: REVERSE_STATUS_MAP[log.status] || 'unprocessed',
    attempts: log.attempts,
    error: log.error || undefined,
    ocsf_event: log.ocsfEvent || undefined,
    matched_rule_id: log.matchedRuleId || undefined,
  };
}

// GET /quarantine — list all quarantine logs, optional ?status= filter
quarantineRouter.get('/quarantine', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status && typeof status === 'string' && STATUS_MAP[status]) {
      where.status = STATUS_MAP[status];
    }

    const logs = await prisma.quarantineLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
    });

    res.json(logs.map(mapLogToResponse));
  } catch (error) {
    console.error('Error fetching quarantine logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /quarantine/:id — get single log by id
quarantineRouter.get('/quarantine/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const log = await prisma.quarantineLog.findUnique({ where: { id } });

    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }

    res.json(mapLogToResponse(log));
  } catch (error) {
    console.error('Error fetching quarantine log:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /quarantine — ingest a new raw log into quarantine
quarantineRouter.post('/quarantine', async (req: Request, res: Response) => {
  try {
    const { raw_log, source } = req.body;
    if (!raw_log) {
      return res.status(400).json({ error: 'raw_log is required' });
    }

    // Attempt to auto-extract source IP from log text
    const ipMatch = raw_log.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
    const autoSource = source || (ipMatch ? ipMatch[1] : 'Unknown');

    const log = await prisma.quarantineLog.create({
      data: {
        rawLog: raw_log,
        source: autoSource,
        status: 'UNPROCESSED',
        attempts: 0,
      },
    });

    // Create hash chain entry for tamper evidence
    const hashData = JSON.stringify({ id: log.id, rawLog: raw_log, timestamp: log.timestamp.toISOString() });
    const hashValue = computeSHA256(hashData);

    const latestEntry = await prisma.hashChainEntry.findFirst({
      orderBy: { timestamp: 'desc' },
    });
    const prevHash = latestEntry ? latestEntry.hashValue : computeSHA256('genesis');

    await prisma.hashChainEntry.create({
      data: {
        eventId: log.id,
        hashValue,
        prevHash,
        merkleRoot: computeMerkleRoot([hashValue, prevHash]),
        signature: generateSignature(hashValue),
        rawData: raw_log,
      },
    });

    // Update log with hash value
    await prisma.quarantineLog.update({
      where: { id: log.id },
      data: { hashValue, prevHash },
    });

    res.status(201).json(mapLogToResponse(log));
  } catch (error) {
    console.error('Error creating quarantine log:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /quarantine/:id — update a log (Approve & Save, etc.)
quarantineRouter.patch('/quarantine/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, ocsf_event, error: logError, attempts } = req.body;

    const dataToUpdate: any = {};
    if (status && STATUS_MAP[status]) dataToUpdate.status = STATUS_MAP[status];
    if (ocsf_event !== undefined) dataToUpdate.ocsfEvent = ocsf_event;
    if (logError !== undefined) dataToUpdate.error = logError;
    if (attempts !== undefined) dataToUpdate.attempts = attempts;

    const updatedLog = await prisma.quarantineLog.update({
      where: { id },
      data: dataToUpdate,
    });

    // Note: We deliberately do NOT update the hash chain on approval.
    // The tamper-evidence hash chain guarantees the integrity of the original ingested log.
    // Updating the hash upon human editing of the JSON would destroy the original proof.

    res.json(mapLogToResponse(updatedLog));
  } catch (error) {
    console.error('Error updating quarantine log:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
