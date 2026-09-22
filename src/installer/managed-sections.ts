import { sha256Bytes } from "./hashing.js";

export function sectionMarkers(sectionId: string) {
  return {
    begin: `<!-- ${sectionId}:begin -->`,
    end: `<!-- ${sectionId}:end -->`
  };
}

export function renderManagedSection(original: string, sectionId: string, content: string): string {
  const { begin, end } = sectionMarkers(sectionId);
  const block = `${begin}\n${content.trim()}\n${end}`;
  const start = original.indexOf(begin);
  const finish = original.indexOf(end);

  if (start === -1 && finish === -1) {
    // Add no unmanaged separator bytes: uninstall can then restore the
    // pre-existing file byte-for-byte. Files that already end in a newline
    // render naturally; a non-newline-terminated file keeps its bytes exact.
    return `${original}${block}\n`;
  }
  if (start === -1 || finish === -1 || finish < start) {
    throw new Error(`Malformed managed section ${sectionId}`);
  }
  const after = finish + end.length;
  return `${original.slice(0, start)}${block}${original.slice(after)}`;
}

export function removeManagedSection(original: string, sectionId: string): string {
  const { begin, end } = sectionMarkers(sectionId);
  const start = original.indexOf(begin);
  if (start === -1) return original;
  const finish = original.indexOf(end, start);
  if (finish === -1) throw new Error(`Malformed managed section ${sectionId}`);
  const before = original.slice(0, start);
  let after = original.slice(finish + end.length);
  // The canonical managed block owns one terminating newline.
  if (after.startsWith("\n")) after = after.slice(1);
  return before + after;
}

export function extractManagedSection(original: string, sectionId: string): string | null {
  const { begin, end } = sectionMarkers(sectionId);
  const start = original.indexOf(begin);
  if (start === -1) return null;
  const finish = original.indexOf(end, start);
  if (finish === -1) return null;
  return original.slice(start + begin.length, finish).replace(/^\n|\n$/g, "");
}

export function managedSectionHash(content: string): string {
  return sha256Bytes(content.trim());
}
