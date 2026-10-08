import type { Migration } from "../index.js";
import { migrateProjectV1ToV2 } from "./v1-to-v2.js";
import { v2ToV3 } from "./v2-to-v3.js";

export const projectMigrations: Migration[] = [migrateProjectV1ToV2, v2ToV3];
