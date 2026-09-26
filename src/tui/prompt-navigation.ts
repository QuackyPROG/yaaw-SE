import * as p from "@clack/prompts";
import type { Key } from "node:readline";
import type { Readable } from "node:stream";
import { navigationBack, navigationCancel, navigationValue, type NavigationResult } from "./navigation.js";

const RAW_ESCAPE = "\x1b";

export function backOption(label = "← Back") {
  return { value: "back" as const, label, hint: "Esc" };
}

function isEscapeKey(char: string | undefined, key: Key): boolean {
  return key.name === "escape" || key.sequence === RAW_ESCAPE || char === RAW_ESCAPE;
}

export async function runBackPrompt<T>(
  prompt: () => Promise<T>,
  input: Readable = process.stdin
): Promise<NavigationResult<T>> {
  const aliases = p.settings.aliases;
  const hadRawEscape = aliases.has(RAW_ESCAPE);
  const previousRawEscape = aliases.get(RAW_ESCAPE);
  let escaped = false;

  // Clack treats Escape as cancellation. YAAW uses Escape as Back, so make
  // the same key complete the current prompt through the normal submit path.
  // This avoids reopening a prompt immediately after Clack's cancel teardown.
  aliases.set(RAW_ESCAPE, "enter");

  const onKeypress = (char: string | undefined, key: Key) => {
    if (!isEscapeKey(char, key)) return;
    escaped = true;

    // Every keypress listener receives the same mutable key object. This
    // listener is prepended before Clack's listener, so Clack sees a regular
    // Return key and closes via submit rather than cancel.
    key.name = "return";
    key.sequence = "\r";
    key.ctrl = false;
    key.meta = false;
    key.shift = false;
  };

  input.prependListener("keypress", onKeypress);

  try {
    const value = await prompt();
    if (escaped) return navigationBack();
    if (p.isCancel(value)) return navigationCancel();
    return navigationValue(value);
  } finally {
    input.removeListener("keypress", onKeypress);
    if (hadRawEscape && previousRawEscape) aliases.set(RAW_ESCAPE, previousRawEscape);
    else aliases.delete(RAW_ESCAPE);
  }
}
