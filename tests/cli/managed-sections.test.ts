import { describe, expect, it } from "vitest";
import { extractManagedSection, removeManagedSection, renderManagedSection } from "../../src/installer/managed-sections.js";

describe("managed sections", () => {
  it("preserves user bytes outside the YAAW block", () => {
    const original = "User line A\nUser line B\n";
    const installed = renderManagedSection(original, "yaaw-se", "## YAAW-SE\ncore");
    expect(installed.startsWith(original)).toBe(true);
    const updated = renderManagedSection(installed, "yaaw-se", "## YAAW-SE\nupdated");
    expect(updated.startsWith(original)).toBe(true);
    expect(extractManagedSection(updated, "yaaw-se")).toContain("updated");
    expect(removeManagedSection(updated, "yaaw-se")).toBe(original);
  });

  it("rejects malformed marker pairs", () => {
    expect(() => renderManagedSection("<!-- yaaw-se:begin -->\n", "yaaw-se", "x")).toThrow();
  });
});
