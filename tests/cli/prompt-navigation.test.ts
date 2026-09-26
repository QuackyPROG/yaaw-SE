import * as p from "@clack/prompts";
import { PassThrough } from "node:stream";
import { describe, expect, it, vi } from "vitest";
import { backOption, runBackPrompt } from "../../src/tui/prompt-navigation.js";

function fakeTty() {
  const input = new PassThrough() as PassThrough & {
    isTTY: boolean;
    setRawMode: (value: boolean) => void;
  };
  input.isTTY = true;
  input.setRawMode = vi.fn();

  const output = new PassThrough() as PassThrough & {
    isTTY: boolean;
    columns: number;
    rows: number;
  };
  output.isTTY = true;
  output.columns = 120;
  output.rows = 40;
  output.resume();

  return { input, output };
}

describe("TUI prompt navigation", () => {
  it("keeps chained prompts interactive after Esc -> Enter -> arrows", async () => {
    const { input, output } = fakeTty();

    const child = runBackPrompt(() => p.select({
      message: "Planner: model",
      input,
      output,
      options: [
        { value: "sol", label: "Sol" },
        { value: "luna", label: "Luna" },
        backOption()
      ]
    }), input);
    input.write("\x1b");
    expect(await child).toEqual({ kind: "back" });

    const parent = runBackPrompt(() => p.select({
      message: "Choose a role to edit",
      input,
      output,
      options: [
        { value: "planner", label: "Planner" },
        { value: "reviewer", label: "Reviewer" },
        backOption()
      ]
    }), input);
    input.write("\r");
    expect(await parent).toEqual({ kind: "value", value: "planner" });

    const nextChild = runBackPrompt(() => p.select({
      message: "Planner: model",
      input,
      output,
      options: [
        { value: "sol", label: "Sol" },
        { value: "luna", label: "Luna" },
        backOption()
      ]
    }), input);
    input.write("\x1b[B");
    input.write("\r");
    expect(await nextChild).toEqual({ kind: "value", value: "luna" });

    const cancel = runBackPrompt(() => p.select({
      message: "Planner: reasoning",
      input,
      output,
      options: [
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
        backOption()
      ]
    }), input);
    input.write("\x03");
    expect(await cancel).toEqual({ kind: "cancel" });
  });

  it("advertises Esc on visible Back actions", () => {
    expect(backOption()).toEqual({
      value: "back",
      label: "← Back",
      hint: "Esc"
    });
  });
});
