import { createHash } from "node:crypto";
import type { ManagedConfigEntry } from "./types.js";

export type TomlScalar = string | number | boolean;

interface ParsedAssignment {
  semanticKey: string;
  localKey: string;
  table: string;
  line: number;
  value: TomlScalar;
}

function newlineOf(text: string) {
  return text.includes("\r\n") ? "\r\n" : "\n";
}

function splitPath(value: string): string[] {
  return value.split(".").map(x => x.trim()).filter(Boolean);
}

function stripInlineComment(value: string): string {
  let quote: '"' | "'" | null = null;
  let escaped = false;
  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i];
    if (quote === '"') {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') quote = null;
    } else if (quote === "'") {
      if (ch === "'") quote = null;
    } else if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "#") return value.slice(0, i).trimEnd();
  }
  return value.trimEnd();
}

function parseString(raw: string): string | null {
  if (raw.startsWith('"') && raw.endsWith('"')) {
    try { return JSON.parse(raw); } catch { throw new Error(`Invalid TOML string: ${raw}`); }
  }
  if (raw.startsWith("'") && raw.endsWith("'")) return raw.slice(1, -1);
  return null;
}

function parseScalar(rawInput: string): TomlScalar | undefined {
  const raw = stripInlineComment(rawInput).trim();
  const stringValue = parseString(raw);
  if (stringValue !== null) return stringValue;
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (/^[+-]?\d+$/.test(raw)) return Number(raw);
  return undefined;
}

function parseAssignments(text: string): ParsedAssignment[] {
  const lines = text.split(/\r?\n/);
  let table = "";
  const parsed: ParsedAssignment[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const header = trimmed.match(/^\[([^\[\]]+)\]\s*(?:#.*)?$/);
    if (header) {
      table = header[1].trim();
      continue;
    }
    if (/^\[\[.*\]\]/.test(trimmed)) {
      table = "";
      continue;
    }
    const assignment = lines[i].match(/^\s*([A-Za-z0-9_-]+)\s*=\s*(.+)$/);
    if (!assignment) continue;
    const value = parseScalar(assignment[2]);
    if (value === undefined) continue;
    const semanticKey = table ? `${table}.${assignment[1]}` : assignment[1];
    if (seen.has(semanticKey)) throw new Error(`Duplicate TOML key: ${semanticKey}`);
    seen.add(semanticKey);
    parsed.push({ semanticKey, localKey: assignment[1], table, line: i, value });
  }
  return parsed;
}

function assertNoObviousSyntaxDamage(text: string) {
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (/^[{}]\s*$/.test(trimmed) || /^\{[^=]*$/.test(trimmed)) {
      throw new Error("Invalid TOML syntax near unmanaged content");
    }
  }
}

export function semanticConfigHash(value: TomlScalar): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function readTomlManagedValue(text: string, semanticKey: string): TomlScalar | undefined {
  assertNoObviousSyntaxDamage(text);
  return parseAssignments(text).find(x => x.semanticKey === semanticKey)?.value;
}

function encodeScalar(value: TomlScalar): string {
  if (typeof value === "string") return JSON.stringify(value);
  return String(value);
}

function setOne(text: string, entry: ManagedConfigEntry): string {
  assertNoObviousSyntaxDamage(text);
  const nl = newlineOf(text);
  const lines = text.split(/\r?\n/);
  const parsed = parseAssignments(text);
  const current = parsed.find(x => x.semanticKey === entry.key);
  const parts = splitPath(entry.key);
  const localKey = parts.at(-1)!;
  const table = parts.slice(0, -1).join(".");
  const rendered = `${localKey} = ${encodeScalar(entry.value)}`;

  if (current) {
    lines[current.line] = rendered;
    return lines.join(nl);
  }

  if (!table) {
    const firstHeader = lines.findIndex(line => /^\s*\[/.test(line));
    const index = firstHeader === -1 ? Math.max(0, lines.length - (lines.at(-1) === "" ? 1 : 0)) : firstHeader;
    lines.splice(index, 0, rendered);
    return lines.join(nl);
  }

  const headerPattern = new RegExp(`^\\s*\\[${table.replace(/[.*+?^$\{\}()|[\]\\]/g, "\\$&")}\\]\\s*(?:#.*)?$`);
  const headerIndex = lines.findIndex(line => headerPattern.test(line));
  if (headerIndex !== -1) {
    let insertAt = headerIndex + 1;
    while (insertAt < lines.length && !/^\s*\[/.test(lines[insertAt])) insertAt += 1;
    while (insertAt > headerIndex + 1 && lines[insertAt - 1].trim() === "") insertAt -= 1;
    lines.splice(insertAt, 0, rendered);
    return lines.join(nl);
  }

  let output = lines.join(nl).replace(/(?:\r?\n)*$/, "");
  if (output) output += nl + nl;
  output += `[${table}]${nl}${rendered}${nl}`;
  return output;
}

export function updateTomlManagedKeys(text: string, entries: ManagedConfigEntry[]): string {
  let output = text;
  for (const entry of entries) output = setOne(output, entry);
  return output;
}

function removeOne(text: string, semanticKey: string): string {
  const nl = newlineOf(text);
  const lines = text.split(/\r?\n/);
  const current = parseAssignments(text).find(x => x.semanticKey === semanticKey);
  if (!current) return text;
  lines.splice(current.line, 1);

  const parts = splitPath(semanticKey);
  const table = parts.slice(0, -1).join(".");
  if (table.startsWith("agents.yaaw_")) {
    const headerPattern = new RegExp(`^\\s*\\[${table.replace(/[.*+?^$\{\}()|[\]\\]/g, "\\$&")}\\]\\s*(?:#.*)?$`);
    const headerIndex = lines.findIndex(line => headerPattern.test(line));
    if (headerIndex !== -1) {
      let end = headerIndex + 1;
      while (end < lines.length && !/^\s*\[/.test(lines[end])) end += 1;
      const body = lines.slice(headerIndex + 1, end).filter(line => line.trim() && !line.trim().startsWith("#"));
      if (body.length === 0) {
        lines.splice(headerIndex, end - headerIndex);
        while (headerIndex < lines.length - 1 && lines[headerIndex]?.trim() === "" && lines[headerIndex + 1]?.trim() === "") {
          lines.splice(headerIndex, 1);
        }
      }
    }
  }
  return lines.join(nl);
}

export function removeTomlManagedKeys(text: string, semanticKeys: string[]): string {
  let output = text;
  for (const key of semanticKeys) output = removeOne(output, key);
  return output;
}

export function validateManagedToml(text: string): void {
  assertNoObviousSyntaxDamage(text);
  parseAssignments(text);
}
