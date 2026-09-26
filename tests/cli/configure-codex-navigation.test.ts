import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultCodexRuntimeSettings } from "../../src/integrations/codex-runtime.js";

const promptState = vi.hoisted(() => ({
  cancel: Symbol("cancel"),
  queue: [] as any[],
  messages: [] as string[],
  configs: [] as any[],
  aliases: new Map<string, any>()
}));

vi.mock("@clack/prompts", () => ({
  note: vi.fn(),
  settings: { aliases: promptState.aliases },
  updateSettings: vi.fn((updates: any) => {
    for (const [key, value] of Object.entries(updates.aliases ?? {})) {
      if (!promptState.aliases.has(key)) promptState.aliases.set(key, value);
    }
  }),
  isCancel: vi.fn((value: unknown) => value === promptState.cancel),
  text: vi.fn(async (config: any) => {
    promptState.messages.push(config.message);
    promptState.configs.push(config);
    if (!promptState.queue.length) throw new Error(`No queued response for text: ${config.message}`);
    return promptState.queue.shift();
  }),
  select: vi.fn(async (config: any) => {
    promptState.messages.push(config.message);
    promptState.configs.push(config);
    if (!promptState.queue.length) throw new Error(`No queued response for select: ${config.message}`);
    return promptState.queue.shift();
  })
}));

import { configureCodex } from "../../src/tui/configure-codex.js";

const context = {
  reason: "manual" as const,
  availableRevision: 4,
  pendingChanges: [],
  currentProfile: { id: "custom", revision: 4 }
};

describe("Codex configuration navigation", () => {
  beforeEach(() => {
    promptState.queue = [];
    promptState.messages = [];
    promptState.configs = [];
    promptState.aliases.clear();
  });

  it("treats ESC at Planner reasoning as Back to Planner model", async () => {
    promptState.queue.push(
      "custom",
      "auto",
      "roles",
      "planner",
      "gpt-6-sol",
      promptState.cancel,
      "back",
      "cancel"
    );

    const result = await configureCodex(defaultCodexRuntimeSettings(), context);
    expect(result.cancelled).toBe(true);

    const reasoningIndex = promptState.messages.indexOf("Planner: reasoning");
    expect(reasoningIndex).toBeGreaterThan(-1);
    expect(promptState.messages[reasoningIndex + 1]).toBe("Planner: model");
  });

  it("treats ESC at Planner model as Back to the role hub", async () => {
    promptState.queue.push(
      "custom",
      "auto",
      "roles",
      "planner",
      promptState.cancel,
      "cancel"
    );

    const result = await configureCodex(defaultCodexRuntimeSettings(), context);
    expect(result.cancelled).toBe(true);

    const modelIndex = promptState.messages.indexOf("Planner: model");
    expect(modelIndex).toBeGreaterThan(-1);
    expect(promptState.messages[modelIndex + 1]).toBe("Choose a role to edit");
  });

  it("shows Esc beside the visible Back action", async () => {
    promptState.queue.push(
      "custom",
      "auto",
      "roles",
      "planner",
      promptState.cancel,
      "cancel"
    );

    await configureCodex(defaultCodexRuntimeSettings(), context);
    const modelPrompt = promptState.configs.find(config => config.message === "Planner: model");
    expect(modelPrompt.options.find((option: any) => option.value === "back")).toMatchObject({
      label: "← Back",
      hint: "Esc"
    });
  });

  it("allows inherited model with explicit reasoning", async () => {
    promptState.queue.push(
      "custom",
      "auto",
      "roles",
      "planner",
      "inherit",
      "max",
      "review"
    );

    const result: any = await configureCodex(defaultCodexRuntimeSettings(), context);
    expect(result.cancelled).not.toBe(true);
    expect(result.profile.id).toBe("custom");
    expect(result.settings.roles.planner).toEqual({ model: null, reasoning: "max" });
  });

  it("uses the recommended three-failure Astra rescue path without forcing Fast mode", async () => {
    promptState.queue.push("recommended");
    const result: any = await configureCodex(defaultCodexRuntimeSettings(), context);
    expect(result.settings.failureFallback.afterFailures).toBe(3);
    expect(result.settings.failureFallback.implementer.model).toBe("gpt-6-astra");
    expect(result.settings.failureFallback.reviewer.model).toBe("gpt-6-astra");
    expect(result.settings.serviceTier).toBeNull();
  });

  it("reopens a saved custom profile with Custom highlighted", async () => {
    promptState.queue.push(promptState.cancel);
    await configureCodex(defaultCodexRuntimeSettings(), context);
    expect(promptState.configs[0].message).toBe("Choose a Codex setup");
    expect(promptState.configs[0].initialValue).toBe("custom");
  });
});
