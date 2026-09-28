/**
 * AI Model Client — calls your external AI model's HTTP endpoint
 * and validates the OCSF output with retry logic.
 *
 * ── How it works ──
 * 1. Sends raw log text to your AI model's HTTP endpoint
 * 2. Expects the model to return an OCSF-structured JSON event
 * 3. Validates the response has required OCSF fields
 * 4. If validation fails, retries up to AI_MAX_RETRIES times
 *    (sending the validation error back to the model so it can self-correct)
 * 5. Returns success with the OCSF event, or failure with the last error
 *
 * ── Adapting to YOUR model ──
 * Your model's endpoint should accept a POST request and return JSON.
 * Edit the `buildRequestBody()` and `extractOcsfFromResponse()` functions
 * below to match your model's specific input/output format.
 */

const AI_MODEL_URL = process.env.AI_MODEL_URL || 'http://localhost:5000/parse';
const AI_MAX_RETRIES = parseInt(process.env.AI_MAX_RETRIES || '3', 10);
const AI_TIMEOUT_MS = parseInt(process.env.AI_TIMEOUT_MS || '60000', 10);

export interface OcsfEvent {
  class_uid: number;
  category_uid: number;
  severity_id: number;
  time: string;
  metadata: {
    uid: string;
    original_format: string;
    vendor_name?: string;
    product_name?: string;
    [key: string]: any;
  };
  unmapped: Record<string, any>;
  [key: string]: any;
}

export interface AiParseResult {
  success: boolean;
  attempts: number;
  ocsf_event?: OcsfEvent;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════════
// ADAPT THESE TWO FUNCTIONS TO YOUR MODEL'S INPUT/OUTPUT FORMAT
// ═══════════════════════════════════════════════════════════════════

/**
 * Build the request body for your AI model.
 *
 * Modify this to match what YOUR model expects.
 * Examples:
 *   - If your model expects { "text": "..." }      → return { text: rawLog }
 *   - If your model expects { "prompt": "..." }     → return { prompt: rawLog }
 *   - If your model expects { "raw_log": "..." }    → return { raw_log: rawLog } (default)
 *   - If it needs extra context on retry            → include the previous error
 */
function buildRequestBody(rawLog: string, attempt: number, previousError?: string): Record<string, any> {
  if (attempt === 1 || !previousError) {
    // First attempt — just send the raw log
    return { raw_log: rawLog };
  }

  // Retry attempt — include the error so the model can self-correct
  return {
    raw_log: rawLog,
    retry: true,
    attempt,
    previous_error: previousError,
    instruction: `Your previous output failed OCSF validation: "${previousError}". Please fix the output and return valid OCSF JSON.`,
  };
}

/**
 * Extract the OCSF event from your model's response.
 *
 * Modify this to match what YOUR model returns.
 * Examples:
 *   - If it returns the OCSF event directly        → return responseBody
 *   - If it returns { "result": { ... } }           → return responseBody.result
 *   - If it returns { "ocsf_event": { ... } }       → return responseBody.ocsf_event (default)
 *   - If it returns { "output": "{ json string }" } → return JSON.parse(responseBody.output)
 */
function extractOcsfFromResponse(responseBody: any): any {
  // Try common response shapes — edit to match your model
  if (responseBody.ocsf_event) return responseBody.ocsf_event;
  if (responseBody.result) return responseBody.result;
  if (responseBody.output && typeof responseBody.output === 'string') {
    return JSON.parse(responseBody.output);
  }
  // If the response itself looks like an OCSF event (has class_uid), use it directly
  if (responseBody.class_uid !== undefined) return responseBody;

  return responseBody;
}

// ═══════════════════════════════════════════════════════════════════
// CORE LOGIC — usually no changes needed below
// ═══════════════════════════════════════════════════════════════════

/**
 * Validate that an object has the minimum required OCSF fields.
 * Returns null if valid, or an error string describing what's wrong.
 */
function validateOcsfEvent(event: any): string | null {
  if (!event || typeof event !== 'object') {
    return 'Response is not a valid JSON object';
  }
  if (typeof event.class_uid !== 'number') {
    return `class_uid must be a number, got ${typeof event.class_uid}`;
  }
  if (typeof event.category_uid !== 'number') {
    return `category_uid must be a number, got ${typeof event.category_uid}`;
  }
  if (typeof event.severity_id !== 'number' || event.severity_id < 0 || event.severity_id > 6) {
    return `severity_id must be an integer between 0 and 6, got ${JSON.stringify(event.severity_id)}`;
  }
  if (!event.time || typeof event.time !== 'string') {
    return `time must be an ISO 8601 string, got ${typeof event.time}`;
  }
  if (!event.metadata || typeof event.metadata !== 'object') {
    return 'metadata must be an object with at least a uid field';
  }
  return null; // valid
}

/**
 * Call the AI model with retry logic and OCSF validation.
 */
export async function callAiModel(rawLog: string): Promise<AiParseResult> {
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= AI_MAX_RETRIES; attempt++) {
    try {
      const body = buildRequestBody(rawLog, attempt, lastError);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

      const response = await fetch(AI_MODEL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        lastError = `AI model returned HTTP ${response.status}: ${await response.text()}`;
        console.warn(`[AI attempt ${attempt}/${AI_MAX_RETRIES}] ${lastError}`);
        continue;
      }

      const responseBody = await response.json();
      const ocsfCandidate = extractOcsfFromResponse(responseBody);

      // Validate the OCSF output
      const validationError = validateOcsfEvent(ocsfCandidate);
      if (validationError) {
        lastError = validationError;
        console.warn(`[AI attempt ${attempt}/${AI_MAX_RETRIES}] Validation failed: ${validationError}`);
        continue;
      }

      // Success — fill in any missing metadata defaults
      const ocsf_event: OcsfEvent = {
        ...ocsfCandidate,
        metadata: {
          uid: ocsfCandidate.metadata?.uid || `evt-ai-${Date.now()}`,
          original_format: 'ai_inferred',
          ...ocsfCandidate.metadata,
        },
        unmapped: ocsfCandidate.unmapped || {},
      };

      return {
        success: true,
        attempts: attempt,
        ocsf_event,
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        lastError = `AI model timed out after ${AI_TIMEOUT_MS}ms`;
      } else {
        lastError = `AI model request failed: ${err.message}`;
      }
      console.warn(`[AI attempt ${attempt}/${AI_MAX_RETRIES}] ${lastError}`);
    }
  }

  // All retries exhausted
  return {
    success: false,
    attempts: AI_MAX_RETRIES,
    error: lastError || 'AI model failed after all retry attempts',
  };
}

/**
 * Check if the AI model endpoint is reachable.
 */
export async function isAiModelAvailable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const resp = await fetch(AI_MODEL_URL, {
      method: 'HEAD',
      signal: controller.signal,
    }).catch(() => null);
    clearTimeout(timeout);
    return resp !== null && resp.ok;
  } catch {
    return false;
  }
}
