const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const payload = path.join(__dirname, '..', 'payload');
const skillsDir = path.join(payload, 'skills');
const agentsDir = path.join(payload, 'agents');

// Reads the YAML frontmatter as flat key: value pairs, plus list items under a key.
function frontmatter(file) {
  const match = fs.readFileSync(file, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert.ok(match, `${file} has no frontmatter`);
  const data = {};
  let listKey = null;
  for (const line of match[1].split(/\r?\n/)) {
    const item = line.match(/^\s+-\s+(.+)$/);
    if (item && listKey) {
      data[listKey].push(item[1].trim());
      continue;
    }
    const pair = line.match(/^([\w-]+):\s*(.*)$/);
    if (!pair) continue;
    listKey = pair[2] === '' ? pair[1] : null;
    data[pair[1]] = pair[2] === '' ? [] : pair[2];
  }
  return data;
}

const skills = fs.readdirSync(skillsDir);
const preloadable = new Set(
  skills.filter((name) => frontmatter(path.join(skillsDir, name, 'SKILL.md'))['disable-model-invocation'] !== 'true'),
);

test('every skill folder has a SKILL.md whose name matches the folder and starts with yaaw-', () => {
  for (const name of skills) {
    const data = frontmatter(path.join(skillsDir, name, 'SKILL.md'));
    assert.equal(data.name, name);
    assert.match(name, /^yaaw-/);
    assert.ok(data.description, `${name} has no description`);
  }
});

test('every agent preloads only skills that exist and can be preloaded', () => {
  for (const file of fs.readdirSync(agentsDir)) {
    const data = frontmatter(path.join(agentsDir, file));
    assert.equal(`${data.name}.md`, file);
    for (const skill of data.skills ?? []) {
      assert.ok(preloadable.has(skill), `${file} preloads ${skill}, which is missing or user-invoked only`);
    }
  }
});

test('every relative link in a skill points at a file that exists', () => {
  for (const name of skills) {
    const dir = path.join(skillsDir, name);
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.md'))) {
      // Links inside fenced code blocks are examples, not real links.
      const body = fs.readFileSync(path.join(dir, file), 'utf8').replace(/```[\s\S]*?```/g, '');
      for (const [, link] of body.matchAll(/\]\(([^)#:]+\.md)\)/g)) {
        assert.ok(fs.existsSync(path.join(dir, link)), `${name}/${file} links to missing ${link}`);
      }
    }
  }
});
