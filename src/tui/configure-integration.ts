import type { ConfigurationContext, ConfigurationSelection, IntegrationId } from "../integrations/types.js";
import { getIntegration } from "../integrations/registry.js";

export async function configureIntegration(
  integrationId: IntegrationId,
  current: unknown,
  context: ConfigurationContext
): Promise<ConfigurationSelection> {
  const adapter = getIntegration(integrationId);
  const configure = adapter.configuration?.configureInteractive;
  if (!configure) throw new Error(`${adapter.displayName} does not provide an interactive YAAW configurator.`);
  return configure(current, context);
}
