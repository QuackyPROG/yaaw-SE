import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IntegrationId } from "../../src/integrations/types.js";

const promptState = vi.hoisted(() => ({
  directory: "",
  tools: [] as string[],
  profile: "standard",
  messages: [] as string[],
  toolOptions: [] as string[]
}));

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  note: vi.fn(),
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  isCancel: vi.fn(() => false),
  text: vi.fn(async (config: any) => {
    promptState.messages.push(config.message);
    return promptState.directory || config.defaultValue;
  }),
  multiselect: vi.fn(async (config: any) => {
    promptState.messages.push(config.message);
    if (config.message === "Which AI coding tools should use YAAW-SE?") {
      promptState.toolOptions = config.options.map((option: any) => String(option.value));
      return [...promptState.tools];
    }
    throw new Error(`Unexpected multiselect prompt: ${config.message}`);
  }),
  select: vi.fn(async (config: any) => {
    promptState.messages.push(config.message);
    if (config.message === "Which YAAW entrypoints should be exposed?") {
      return promptState.profile;
    }
    throw new Error(`Unexpected select prompt: ${config.message}`);
  }),
  confirm: vi.fn(async (config: any) => {
    promptState.messages.push(config.message);
    return true;
  })
}));

import { runInstall } from "../../src/cli/commands/install.js";
import { integrationIds } from "../../src/integrations/registry.js";

interface ProviderSurface {
  providerRoot: string;
  skillsRoot: string;
  bootstrap: string;
}

const providerSurfaces: Record<IntegrationId, ProviderSurface> = {
  codex: {
    providerRoot: ".agents",
    skillsRoot: ".agents/skills",
    bootstrap: "AGENTS.md"
  },
  "claude-code": {
    providerRoot: ".claude",
    skillsRoot: ".claude/skills",
    bootstrap: "CLAUDE.md"
  },
  "gemini-cli": {
    providerRoot: ".gemini",
    skillsRoot: ".gemini/skills",
    bootstrap: "GEMINI.md"
  },
  cline: {
    providerRoot: ".cline",
    skillsRoot: ".cline/skills",
    bootstrap: ".cline/rules/yaaw-se.md"
  }
};

const expectedCoreEntries = [
  "core",
  "expertise",
  "install",
  "project",
  "registries",
  "roles",
  "rules",
  "runtime",
  "schemas",
  "templates",
  "workflows"
].sort();

const expectedProjectEntries = [
  "engineering.md",
  "evidence",
  "product.md",
  "research",
  "reviews",
  "rules",
  "specs",
  "state.json",
  "tickets"
].sort();

async function exists(path: string): Promise<boolean> {
  try {
    await readdir(path);
    return true;
  } catch {
    try {
      await readFile(path);
      return true;
    } catch {
      return false;
    }
  }
}

async function entries(path: string): Promise<string[]> {
  return (await readdir(path)).sort();
}

function firstSegment(path: string): string {
  return path.split("/")[0]!;
}

async function assertConsumerLayout(root: string, selectedTools: IntegrationId[]) {
  const selected = new Set<IntegrationId>(selectedTools);
  const manifestPath = join(root, ".yaaw-core", "install", "manifest.json");
  const manifest: any = JSON.parse(await readFile(manifestPath, "utf8"));

  expect(manifest.schema).toBe("yaaw.installation/v1");
  expect(Object.keys(manifest.integrations).sort()).toEqual([...selectedTools].sort());
  expect(manifest.skills.length).toBeGreaterThan(0);

  const expectedRoot = new Set<string>([".yaaw-core"]);
  for (const id of selectedTools) {
    const surface = providerSurfaces[id];
    expectedRoot.add(surface.providerRoot);
    const bootstrapTop = firstSegment(surface.bootstrap);
    if (bootstrapTop !== surface.providerRoot) expectedRoot.add(bootstrapTop);
  }

  expect(await entries(root)).toEqual([...expectedRoot].sort());
  expect(await exists(join(root, ".yaaw"))).toBe(false);

  expect(await entries(join(root, ".yaaw-core"))).toEqual(expectedCoreEntries);
  expect(await entries(join(root, ".yaaw-core", "project"))).toEqual(expectedProjectEntries);
  expect(await entries(join(root, ".yaaw-core", "runtime"))).toEqual([]);
  expect(await entries(join(root, ".yaaw-core", "install"))).toEqual(["manifest.json"]);

  const manifestOwners = [
    ...Object.values(manifest.managedFiles).map((record: any) => record.owner),
    ...Object.values(manifest.managedSections).flatMap((sections: any) =>
      Object.values(sections).map((record: any) => record.owner)
    )
  ];

  for (const id of integrationIds) {
    const surface = providerSurfaces[id];
    if (selected.has(id)) {
      const expectedProviderEntries = id === "cline" ? ["rules", "skills"] : ["skills"];
      expect(await entries(join(root, surface.providerRoot))).toEqual(expectedProviderEntries);
      expect(await entries(join(root, surface.skillsRoot))).toEqual([...manifest.skills].sort());

      for (const skill of manifest.skills) {
        const skillDir = join(root, surface.skillsRoot, skill);
        expect(await entries(skillDir)).toEqual(["SKILL.md"]);
        const skillText = await readFile(join(skillDir, "SKILL.md"), "utf8");
        expect(skillText).toContain(`\nname: ${skill}\n`);
        expect(skillText).toContain(".yaaw-core/");
      }

      const bootstrapText = await readFile(join(root, surface.bootstrap), "utf8");
      expect(bootstrapText).toContain(".yaaw-core/");
      expect(manifestOwners).toContain(`integration:${id}`);
    } else {
      expect(await exists(join(root, surface.providerRoot))).toBe(false);
      if (firstSegment(surface.bootstrap) !== surface.providerRoot) {
        expect(await exists(join(root, surface.bootstrap))).toBe(false);
      }
      expect(manifestOwners).not.toContain(`integration:${id}`);
    }
  }
}

const journeys: Array<[string, IntegrationId[]]> = [
  ["Codex only", ["codex"]],
  ["Claude Code only", ["claude-code"]],
  ["Gemini CLI only", ["gemini-cli"]],
  ["Cline only", ["cline"]],
  ["all Tier-1 providers", ["codex", "claude-code", "gemini-cli", "cline"]]
];

describe("interactive TUI consumer journeys", () => {
  beforeEach(() => {
    promptState.directory = "";
    promptState.tools = [];
    promptState.profile = "standard";
    promptState.messages = [];
    promptState.toolOptions = [];
  });

  it("keeps the provider journey matrix synchronized with the integration registry", () => {
    expect(Object.keys(providerSurfaces).sort()).toEqual([...integrationIds].sort());
  });

  it.each(journeys)("%s installs only the selected provider surfaces plus canonical .yaaw-core", async (_name, tools) => {
    const root = await mkdtemp(join(tmpdir(), "yaaw-tui-journey-"));
    promptState.directory = root;
    promptState.tools = tools;
    promptState.profile = "standard";

    try {
      const result = await runInstall({ directory: root });

      expect(result?.tools).toEqual(tools);
      expect(promptState.toolOptions.sort()).toEqual([...integrationIds].sort());
      expect(promptState.messages).toEqual([
        "Where should YAAW-SE be installed?",
        "Which AI coding tools should use YAAW-SE?",
        "Which YAAW entrypoints should be exposed?",
        "Continue?"
      ]);

      await assertConsumerLayout(root, tools);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
