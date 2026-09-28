import type { ParseLogResponse, RawLogItem, RegistryRule, TamperVerifyResponse } from '../types/log';
import { INITIAL_QUARANTINE_LOGS, MOCK_VERIFY_RESPONSE } from './mockData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const USE_MOCK_FALLBACK = true;

export async function parseLogApi(rawLog: string): Promise<ParseLogResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/parse_log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_log: rawLog }),
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    if (!USE_MOCK_FALLBACK) {
      throw err;
    }
  }

  // Realistic mock inference logic based on log contents:
  await new Promise((resolve) => setTimeout(resolve, 1500));

  if (rawLog.includes('PROPRIETARY-PLC') || rawLog.includes('Buffer Overflow Attempt')) {
    return {
      status: 'quarantined',
      attempts: 3,
      raw_log: rawLog,
      error: 'Validation error: Schema field "severity_id" must be an integer between 0 and 6. Unmapped binary headers failed JSON schema checks after 3 retries.'
    };
  }

  // Parse success simulation
  let categoryUid = 3;
  let classUid = 3002;
  let severity = 3;
  let vendor = "Generic Syslog";

  if (rawLog.includes('sshd')) {
    classUid = 3002;
    categoryUid = 3;
    severity = 3;
    vendor = "Linux OpenSSH";
  } else if (rawLog.includes('ASA') || rawLog.includes('Deny')) {
    classUid = 4001;
    categoryUid = 4;
    severity = 3;
    vendor = "Cisco ASA Firewall";
  } else if (rawLog.includes('IAMUser') || rawLog.includes('s3.amazonaws.com')) {
    classUid = 6001;
    categoryUid = 6;
    severity = 4;
    vendor = "AWS CloudTrail";
  } else if (rawLog.includes('Microsoft-Windows-Security')) {
    classUid = 3002;
    categoryUid = 3;
    severity = 3;
    vendor = "Microsoft Windows Event Log";
  }

  return {
    status: 'parsed',
    attempts: 1,
    ocsf_event: {
      class_uid: classUid,
      category_uid: categoryUid,
      severity_id: severity,
      time: new Date().toISOString(),
      metadata: {
        uid: `evt-ocsf-${Math.floor(1000 + Math.random() * 9000)}`,
        original_format: 'ai_inferred',
        vendor_name: vendor,
        product_name: `${vendor} Engine`
      },
      unmapped: {
        raw_length: rawLog.length,
        inferred_at: new Date().toISOString(),
        parser_engine: "OmniLog-Local-AI-v1.4"
      }
    }
  };
}

export async function fetchQuarantineLogsApi(): Promise<RawLogItem[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/quarantine`);
    if (response.ok) {
      return await response.json();
    }
  } catch {
    // Fall back to mock data
  }
  return INITIAL_QUARANTINE_LOGS;
}

export async function verifyLogIntegrityApi(eventId: string, simulateTampered = false): Promise<TamperVerifyResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/verify/${eventId}`);
    if (response.ok) {
      return await response.json();
    }
  } catch {
    // Fall back to mock
  }

  await new Promise((res) => setTimeout(res, 800));

  if (simulateTampered) {
    return {
      ...MOCK_VERIFY_RESPONSE,
      event_id: eventId,
      verified: false,
      computed_hash: "0xdeadbeef7c9f2e4a1b0c8d6e3f5a7c9e2b4d6f8a",
    };
  }

  return {
    ...MOCK_VERIFY_RESPONSE,
    event_id: eventId,
    verified: true,
  };
}

export async function promoteToRegistryApi(payload: { logId: string; pattern: string; ruleName: string; ocsfClass: string }): Promise<RegistryRule> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/registry/promote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      return await response.json();
    }
  } catch {
    // Fallback
  }

  return {
    id: `rule-${Date.now()}`,
    rule_name: payload.ruleName || "New Inferred Pattern Rule",
    source_pattern: payload.pattern || ".*",
    ocsf_class: payload.ocsfClass || "Authentication (3002)",
    class_uid: 3002,
    created_from_ai: true,
    promoted_at: new Date().toISOString(),
    match_count: 1,
    avg_latency_ms: 0.15
  };
}
