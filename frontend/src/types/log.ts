export type LogStatus = 'unprocessed' | 'ai_resolved' | 'needs_review' | 'approved';

export interface OCSFEvent {
  class_uid: number;
  category_uid: number;
  severity_id: number; // 0: Unknown, 1: Informational, 2: Low, 3: Medium, 4: High, 5: Critical, 6: Fatal
  time: string;
  metadata: {
    uid: string;
    original_format: 'ai_inferred' | 'deterministic_registry' | 'manual_authoring';
    product_name?: string;
    vendor_name?: string;
    version?: string;
  };
  unmapped: Record<string, any>;
  [key: string]: any;
}

export interface RawLogItem {
  id: string;
  timestamp: string;
  source: string;
  raw_log: string;
  status: LogStatus;
  attempts?: number;
  error?: string;
  ocsf_event?: OCSFEvent;
  matched_rule_id?: string;
}

export interface ParseLogResponse {
  status: 'parsed' | 'quarantined';
  attempts: number;
  ocsf_event?: OCSFEvent;
  raw_log?: string;
  error?: string;
}

export interface TamperVerifyResponse {
  event_id: string;
  verified: boolean;
  previous_hash: string;
  current_hash: string;
  next_hash: string;
  timestamp: string;
  merkle_root: string;
  signature: string;
  computed_hash?: string;
}

export interface RegistryRule {
  id: string;
  rule_name: string;
  source_pattern: string;
  ocsf_class: string;
  class_uid: number;
  created_from_ai: boolean;
  promoted_at: string;
  match_count: number;
  avg_latency_ms: number;
}
