export type CodexRuntimeMode = "auto" | "isolated-required" | "inline";
export type CodexWebSearchMode = "disabled" | "cached" | "indexed" | "live";
export type CodexServiceTier = "default" | "fast" | "flex";
export type CodexRuntimeScalar = string | number | boolean;

export interface CodexModelSettings {
  model: string | null;
  reasoning: string | null;
}

export interface CodexFailureFallbackSettings {
  afterFailures: number | null;
  implementer: CodexModelSettings;
  reviewer: CodexModelSettings;
}

export interface CodexRuntimeSettings {
  mode: CodexRuntimeMode;
  orchestrator: CodexModelSettings;
  defaultWorker: CodexModelSettings;
  roles: {
    prd: CodexModelSettings;
    planner: CodexModelSettings;
    implementer: CodexModelSettings;
    reviewer: CodexModelSettings;
  };
  failureFallback: CodexFailureFallbackSettings;
  serviceTier: CodexServiceTier | null;
  maxConcurrentThreads: number | null;
  sandboxMode: string | null;
  approvalPolicy: string | null;
  webSearch: CodexWebSearchMode | null;
}

const inheritedModel = (): CodexModelSettings => ({ model: null, reasoning: null });

export function defaultCodexRuntimeSettings(): CodexRuntimeSettings {
  return {
    mode: "auto",
    orchestrator: inheritedModel(),
    defaultWorker: inheritedModel(),
    roles: {
      prd: inheritedModel(),
      planner: inheritedModel(),
      implementer: inheritedModel(),
      reviewer: inheritedModel()
    },
    failureFallback: {
      afterFailures: null,
      implementer: inheritedModel(),
      reviewer: inheritedModel()
    },
    serviceTier: null,
    maxConcurrentThreads: null,
    sandboxMode: null,
    approvalPolicy: null,
    webSearch: null
  };
}

function nullableString(value: unknown, label: string): string | null {
  if (value === undefined || value === null || value === "inherit") return null;
  if (typeof value !== "string" || !value.trim()) throw new Error(`Invalid Codex ${label}`);
  return value.trim();
}

function modelSettings(value: any, fallback: CodexModelSettings, label: string): CodexModelSettings {
  const source = value ?? {};
  return {
    model: source.model === undefined ? fallback.model : nullableString(source.model, `${label} model`),
    reasoning: source.reasoning === undefined ? fallback.reasoning : nullableString(source.reasoning, `${label} reasoning`)
  };
}

function failureFallbackSettings(value: any, fallback: CodexFailureFallbackSettings): CodexFailureFallbackSettings {
  const source = value ?? {};
  const raw = source.afterFailures === undefined ? fallback.afterFailures : source.afterFailures;
  const afterFailures = raw === undefined || raw === null || raw === "inherit" || raw === "off" || raw === "disabled"
    ? null
    : Number(raw);
  if (afterFailures !== null && (!Number.isInteger(afterFailures) || afterFailures < 1)) {
    throw new Error("Codex failure fallback threshold must be a positive integer or disabled");
  }
  return {
    afterFailures,
    implementer: modelSettings(source.implementer, fallback.implementer, "Implementer fallback"),
    reviewer: modelSettings(source.reviewer, fallback.reviewer, "Reviewer fallback")
  };
}

function serviceTierValue(value: unknown, fallback: CodexServiceTier | null): CodexServiceTier | null {
  const raw = value === undefined ? fallback : value;
  if (raw === undefined || raw === null || raw === "inherit" || raw === "auto") return null;
  if (raw === "priority") return "fast";
  if (!["default", "fast", "flex"].includes(String(raw))) {
    throw new Error(`Invalid Codex service tier: ${String(raw)}`);
  }
  return raw as CodexServiceTier;
}

export function normalizeCodexRuntimeSettings(value: any, fallback = defaultCodexRuntimeSettings()): CodexRuntimeSettings {
  const source = value ?? {};
  const mode = source.mode ?? source.runtime ?? fallback.mode;
  if (!["auto", "isolated-required", "inline"].includes(mode)) {
    throw new Error(`Invalid Codex runtime mode: ${String(mode)}`);
  }
  const maxRaw = source.maxConcurrentThreads ?? source.maxConcurrentAgents ?? fallback.maxConcurrentThreads;
  const maxConcurrentThreads = maxRaw === undefined || maxRaw === null || maxRaw === "inherit"
    ? null
    : Number(maxRaw);
  if (maxConcurrentThreads !== null && (!Number.isInteger(maxConcurrentThreads) || maxConcurrentThreads < 1)) {
    throw new Error("Codex max concurrent threads must be a positive integer or inherit");
  }
  const webRaw = source.webSearch ?? fallback.webSearch;
  const webSearch = webRaw === undefined || webRaw === null || webRaw === "inherit" ? null : webRaw;
  if (webSearch !== null && !["disabled", "cached", "indexed", "live"].includes(webSearch)) {
    throw new Error(`Invalid Codex web search mode: ${String(webSearch)}`);
  }

  return {
    mode,
    orchestrator: modelSettings(source.orchestrator, fallback.orchestrator, "orchestrator"),
    defaultWorker: modelSettings(source.defaultWorker, fallback.defaultWorker, "default worker"),
    roles: {
      prd: modelSettings(source.roles?.prd, fallback.roles.prd, "PRD"),
      planner: modelSettings(source.roles?.planner, fallback.roles.planner, "Planner"),
      implementer: modelSettings(source.roles?.implementer, fallback.roles.implementer, "Implementer"),
      reviewer: modelSettings(source.roles?.reviewer, fallback.roles.reviewer, "Reviewer")
    },
    failureFallback: failureFallbackSettings(source.failureFallback, fallback.failureFallback),
    serviceTier: serviceTierValue(source.serviceTier, fallback.serviceTier),
    maxConcurrentThreads,
    sandboxMode: source.sandboxMode === undefined ? fallback.sandboxMode : nullableString(source.sandboxMode, "sandbox mode"),
    approvalPolicy: source.approvalPolicy === undefined ? fallback.approvalPolicy : nullableString(source.approvalPolicy, "approval policy"),
    webSearch
  };
}

export function parseCodexInstallConfig(value: any): CodexRuntimeSettings {
  if (!value || value.schema !== "yaaw.codex-install/v1") {
    throw new Error("Codex config file must use schema yaaw.codex-install/v1");
  }
  const forbidden = /(?:api.?key|token|secret|password|cookie|credential)/i;
  const inspect = (node: unknown, path = "") => {
    if (!node || typeof node !== "object") return;
    for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
      const next = path ? `${path}.${key}` : key;
      if (forbidden.test(key)) throw new Error(`Codex installer configuration must not contain credentials: ${next}`);
      inspect(child, next);
    }
  };
  inspect(value);
  return normalizeCodexRuntimeSettings(value);
}
