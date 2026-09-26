import type { InstallOperation } from "../types.js";

export interface MigrationContext {
  projectRoot: string;
  payloadRoot: string;
  fromVersion: number;
  toVersion: number;
}

export interface Migration {
  from: number;
  to: number;
  describe(): string;
  plan(ctx: MigrationContext): Promise<InstallOperation[]>;
}

export const CURRENT_SYSTEM_SCHEMA = 3;
export const CURRENT_INSTALLATION_SCHEMA = 3;
export const CURRENT_PROJECT_SCHEMA = 2;

export function migrationPath(migrations: Migration[], from: number, to: number): Migration[] {
  if (from === to) return [];
  if (from > to) throw new Error(`Schema downgrade is not supported: ${from} -> ${to}`);
  const result: Migration[] = [];
  let current = from;
  while (current < to) {
    const next = migrations.find(m => m.from === current);
    if (!next) throw new Error(`No migration registered from schema ${current} toward ${to}`);
    if (next.to <= current) throw new Error(`Invalid migration ${next.from} -> ${next.to}`);
    result.push(next);
    current = next.to;
  }
  if (current !== to) throw new Error(`Migration chain ended at ${current}, expected ${to}`);
  return result;
}
