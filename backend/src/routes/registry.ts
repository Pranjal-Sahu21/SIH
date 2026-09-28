import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const registryRouter = Router();

function mapRuleToResponse(rule: any) {
  return {
    id: rule.id,
    rule_name: rule.ruleName,
    source_pattern: rule.sourcePattern,
    ocsf_class: rule.ocsfClass,
    class_uid: rule.classUid,
    created_from_ai: rule.createdFromAi,
    promoted_at: rule.promotedAt.toISOString(),
    match_count: rule.matchCount,
    avg_latency_ms: rule.avgLatencyMs,
  };
}

// GET /registry — list all deterministic parser rules
registryRouter.get('/registry', async (_req: Request, res: Response) => {
  try {
    const rules = await prisma.registryRule.findMany({
      orderBy: { promotedAt: 'desc' },
    });
    res.json(rules.map(mapRuleToResponse));
  } catch (error) {
    console.error('Error fetching registry rules:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /registry/promote — promote an AI mapping into a permanent registry rule
registryRouter.post('/registry/promote', async (req: Request, res: Response) => {
  try {
    const { logId, pattern, ruleName, ocsfClass } = req.body;

    if (!logId || !pattern || !ruleName || !ocsfClass) {
      return res.status(400).json({
        error: 'logId, pattern, ruleName, and ocsfClass are all required',
      });
    }

    // Find the source log
    const log = await prisma.quarantineLog.findUnique({ where: { id: logId } });
    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }

    const ocsfEvent = log.ocsfEvent as any;
    const classUid = ocsfEvent?.class_uid || 1000;

    // Create the registry rule
    const rule = await prisma.registryRule.create({
      data: {
        ruleName,
        sourcePattern: pattern,
        ocsfClass,
        classUid,
        createdFromAi: true,
        matchCount: 1,
        avgLatencyMs: 0.15,
      },
    });

    // Update the log to reference this rule
    await prisma.quarantineLog.update({
      where: { id: logId },
      data: { matchedRuleId: rule.id },
    });

    res.status(201).json(mapRuleToResponse(rule));
  } catch (error) {
    console.error('Error promoting rule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
