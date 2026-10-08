function indentOf(line) {
  const match = String(line).match(/^ */);
  return match ? match[0].length : 0;
}

function unquote(raw) {
  if (raw.length >= 2 && raw.startsWith("\"") && raw.endsWith("\"")) {
    try { return JSON.parse(raw); } catch { return raw.slice(1, -1); }
  }
  if (raw.length >= 2 && raw.startsWith("'") && raw.endsWith("'")) {
    return raw.slice(1, -1).replace(/''/g, "'");
  }
  return raw;
}

function splitInline(raw) {
  const out = [];
  let start = 0, quote = null, depth = 0;
  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i];
    if (quote) {
      if (ch === quote && raw[i - 1] !== "\\") quote = null;
      continue;
    }
    if (ch === "\"" || ch === "'") { quote = ch; continue; }
    if (ch === "[" || ch === "{") depth += 1;
    else if (ch === "]" || ch === "}") depth -= 1;
    else if (ch === "," && depth === 0) {
      out.push(raw.slice(start, i));
      start = i + 1;
    }
  }
  out.push(raw.slice(start));
  return out;
}

export function parseScalar(value) {
  const raw = String(value ?? "").trim();
  if (raw === "") return "";
  if (raw === "null" || raw === "~") return null;
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (/^-?\d+$/.test(raw)) return Number(raw);
  if (raw.startsWith("[") && raw.endsWith("]")) {
    try { return JSON.parse(raw); } catch {}
    const body = raw.slice(1, -1).trim();
    if (!body) return [];
    return splitInline(body).map(item => parseScalar(item));
  }
  if (raw.startsWith("{") && raw.endsWith("}")) {
    try { return JSON.parse(raw); } catch {}
  }
  return unquote(raw);
}

function nextContent(lines, index, end) {
  for (let i = index; i < end; i += 1) {
    const trimmed = lines[i].trim();
    if (trimmed && !trimmed.startsWith("#")) return i;
  }
  return end;
}

function keyValue(text) {
  const index = text.indexOf(":");
  if (index <= 0) return null;
  return [text.slice(0, index).trim(), text.slice(index + 1).trim()];
}

function parseMapping(lines, start, end, indent) {
  const out = {};
  let i = start;
  while (i < end) {
    i = nextContent(lines, i, end);
    if (i >= end) break;
    const raw = lines[i], current = indentOf(raw), trimmed = raw.trim();
    if (current < indent) break;
    if (current > indent) throw new Error(`unexpected indentation at frontmatter line ${i + 1}`);
    if (trimmed.startsWith("-")) break;
    const pair = keyValue(trimmed);
    if (!pair) throw new Error(`invalid frontmatter mapping at line ${i + 1}`);
    const [key, rest] = pair;
    if (rest !== "") {
      out[key] = parseScalar(rest);
      i += 1;
      continue;
    }
    const next = nextContent(lines, i + 1, end);
    if (next >= end || indentOf(lines[next]) <= indent) {
      out[key] = {};
      i += 1;
      continue;
    }
    const [child, after] = parseNode(lines, next, end, indentOf(lines[next]));
    out[key] = child;
    i = after;
  }
  return [out, i];
}

function parseSequence(lines, start, end, indent) {
  const out = [];
  let i = start;
  while (i < end) {
    i = nextContent(lines, i, end);
    if (i >= end) break;
    const raw = lines[i], current = indentOf(raw), trimmed = raw.trim();
    if (current < indent) break;
    if (current > indent) throw new Error(`unexpected indentation at frontmatter line ${i + 1}`);
    if (!trimmed.startsWith("-")) break;
    const body = trimmed.slice(1).trim();
    if (body === "") {
      const next = nextContent(lines, i + 1, end);
      if (next >= end || indentOf(lines[next]) <= indent) {
        out.push(null);
        i += 1;
        continue;
      }
      const [child, after] = parseNode(lines, next, end, indentOf(lines[next]));
      out.push(child);
      i = after;
      continue;
    }
    const pair = keyValue(body);
    if (pair) {
      const item = {};
      const [key, rest] = pair;
      item[key] = rest === "" ? {} : parseScalar(rest);
      const next = nextContent(lines, i + 1, end);
      if (next < end && indentOf(lines[next]) > indent) {
        const childIndent = indentOf(lines[next]);
        if (rest === "") {
          const [child, after] = parseNode(lines, next, end, childIndent);
          item[key] = child;
          i = after;
        } else {
          const [extra, after] = parseMapping(lines, next, end, childIndent);
          Object.assign(item, extra);
          i = after;
        }
      } else {
        i += 1;
      }
      out.push(item);
      continue;
    }
    out.push(parseScalar(body));
    i += 1;
  }
  return [out, i];
}

function parseNode(lines, start, end, indent) {
  const index = nextContent(lines, start, end);
  if (index >= end) return [{}, end];
  return lines[index].trim().startsWith("-")
    ? parseSequence(lines, index, end, indent)
    : parseMapping(lines, index, end, indent);
}

export function parseFrontmatter(text) {
  const lines = String(text).split(/\r?\n/);
  if (lines[0]?.trim() !== "---") throw new Error("missing opening frontmatter");
  const relativeEnd = lines.slice(1).findIndex(line => line.trim() === "---");
  if (relativeEnd < 0) throw new Error("missing closing frontmatter");
  const end = relativeEnd + 1;
  const start = nextContent(lines, 1, end);
  if (start >= end) return {};
  const [value, after] = parseMapping(lines, start, end, indentOf(lines[start]));
  const trailing = nextContent(lines, after, end);
  if (trailing < end) throw new Error(`unsupported frontmatter syntax at line ${trailing + 1}`);
  return value;
}
