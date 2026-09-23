import { describe, expect, it } from "vitest";
import {
  readTomlManagedValue,
  removeTomlManagedKeys,
  semanticConfigHash,
  updateTomlManagedKeys,
  validateManagedToml
} from "../../src/installer/toml-managed.js";

describe("managed TOML keys", () => {
  it("adds managed keys while preserving unrelated user bytes and tables", () => {
    const input = [
      '# user comment',
      'model = "user-model"',
      '',
      '[mcp_servers.foo]',
      'command = "foo"',
      '',
      '[agents.researcher]',
      'description = "mine"',
      ''
    ].join("\n");

    const output = updateTomlManagedKeys(input, [
      { key: "agents.yaaw_planner.description", value: "YAAW planner" },
      { key: "agents.yaaw_planner.config_file", value: "agents/yaaw-planner.toml" }
    ]);
    expect(output).toContain('# user comment\nmodel = "user-model"');
    expect(output).toContain('[mcp_servers.foo]\ncommand = "foo"');
    expect(output).toContain('[agents.researcher]\ndescription = "mine"');
    expect(readTomlManagedValue(output, "agents.yaaw_planner.config_file")).toBe("agents/yaaw-planner.toml");
  });

  it("removes only requested managed keys and leaves user roles/settings intact", () => {
    const input = updateTomlManagedKeys(
      'model = "user-model"\n\n[agents.researcher]\ndescription = "mine"\n',
      [
        { key: "agents.yaaw_planner.description", value: "YAAW planner" },
        { key: "agents.yaaw_planner.config_file", value: "agents/yaaw-planner.toml" }
      ]
    );
    const output = removeTomlManagedKeys(input, [
      "agents.yaaw_planner.description",
      "agents.yaaw_planner.config_file"
    ]);
    expect(output).toContain('model = "user-model"');
    expect(output).toContain('[agents.researcher]');
    expect(output).not.toContain('[agents.yaaw_planner]');
  });

  it("hashes semantic values rather than whitespace", () => {
    const a = readTomlManagedValue('model="foo"\n', "model")!;
    const b = readTomlManagedValue('model = "foo" # same value\n', "model")!;
    expect(semanticConfigHash(a)).toBe(semanticConfigHash(b));
  });

  it("rejects duplicate managed scalar definitions", () => {
    expect(() => validateManagedToml('model = "a"\nmodel = "b"\n')).toThrow(/Duplicate TOML key/);
  });

  it("rejects obviously invalid non-TOML input before mutation", () => {
    expect(() => updateTomlManagedKeys("{not-toml", [{ key: "model", value: "x" }])).toThrow(/Invalid TOML/);
  });
});
