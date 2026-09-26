import * as p from "@clack/prompts";

const RAW_ESCAPE = "\x1b";

export function backOption(label = "← Back") {
  return { value: "back" as const, label, hint: "Esc" };
}

export async function withEscapeNavigation<T>(prompt: () => Promise<T>): Promise<T> {
  const aliases = p.settings.aliases;
  const hadRawEscape = aliases.has(RAW_ESCAPE);
  const previous = aliases.get(RAW_ESCAPE);

  if (!hadRawEscape) {
    p.updateSettings({ aliases: { [RAW_ESCAPE]: "cancel" } });
  }

  try {
    return await prompt();
  } finally {
    if (!hadRawEscape) {
      aliases.delete(RAW_ESCAPE);
    } else if (previous) {
      aliases.set(RAW_ESCAPE, previous);
    }
  }
}
