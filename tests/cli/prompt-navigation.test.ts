import * as p from "@clack/prompts";
import { describe, expect, it } from "vitest";
import { backOption, withEscapeNavigation } from "../../src/tui/prompt-navigation.js";

const RAW_ESCAPE = "\x1b";

describe("TUI prompt navigation", () => {
  it("maps the raw Escape byte to cancel only while a YAAW prompt is active", async () => {
    const previous = p.settings.aliases.get(RAW_ESCAPE);
    p.settings.aliases.delete(RAW_ESCAPE);

    try {
      const activeAlias = await withEscapeNavigation(async () => p.settings.aliases.get(RAW_ESCAPE));
      expect(activeAlias).toBe("cancel");
      expect(p.settings.aliases.has(RAW_ESCAPE)).toBe(false);
    } finally {
      if (previous) p.settings.aliases.set(RAW_ESCAPE, previous);
    }
  });

  it("advertises Esc on visible Back actions", () => {
    expect(backOption()).toEqual({
      value: "back",
      label: "← Back",
      hint: "Esc"
    });
  });
});
