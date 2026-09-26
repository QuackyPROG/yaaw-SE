import { beforeEach, describe, expect, it, vi } from "vitest";

const promptState = vi.hoisted(() => ({
  cancel: Symbol("cancel"),
  escape: Symbol("escape"),
  queue: [] as any[],
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
  select: vi.fn(async (config: any) => {
    promptState.configs.push(config);
    if (!promptState.queue.length) throw new Error("No queued response");
    const response = promptState.queue.shift();
    if (response === promptState.escape) {
      process.stdin.emit("keypress", undefined, {
        name: "escape",
        sequence: "\x1b",
        ctrl: false,
        meta: false,
        shift: false
      });
      return "apply";
    }
    return response;
  })
}));

vi.mock("../../src/integrations/registry.js", () => ({
  getIntegration: vi.fn(() => ({
    displayName: "Codex",
    configuration: {
      describe: (settings: any) => [
        `Runtime: ${settings.mode}`,
        `Planner: ${settings.planner}`
      ]
    }
  }))
}));

import { confirmConfiguration } from "../../src/tui/confirm-configuration.js";

describe("configuration review navigation", () => {
  beforeEach(() => {
    promptState.queue = [];
    promptState.configs = [];
    promptState.aliases.clear();
  });

  it("treats Esc as Back instead of cancelling configuration", async () => {
    promptState.queue.push(promptState.escape);

    const result = await confirmConfiguration({
      projectRoot: "/tmp/project",
      integrationId: "codex",
      currentSettings: { mode: "auto", planner: "old" },
      newSettings: { mode: "auto", planner: "new" },
      currentProfile: { id: "custom", revision: 4 },
      newProfile: { id: "custom", revision: 4 }
    });

    expect(result).toBe("back");
    expect(promptState.configs[0].message).toBe("Apply these settings?");
    expect(promptState.configs[0].options.find((option: any) => option.value === "back")).toMatchObject({
      label: "← Back to edit",
      hint: "Esc"
    });
  });

  it("keeps Ctrl+C as an explicit cancel", async () => {
    promptState.queue.push(promptState.cancel);

    const result = await confirmConfiguration({
      projectRoot: "/tmp/project",
      integrationId: "codex",
      currentSettings: { mode: "auto", planner: "old" },
      newSettings: { mode: "auto", planner: "new" },
      currentProfile: { id: "custom", revision: 4 },
      newProfile: { id: "custom", revision: 4 }
    });

    expect(result).toBe("cancel");
  });
});
