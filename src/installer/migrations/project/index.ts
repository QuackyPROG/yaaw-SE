import type { Migration } from "../index.js";
import { migrateProjectV1ToV2 } from "./v1-to-v2.js";

export const projectMigrations: Migration[] = [migrateProjectV1ToV2];
