import { getConfig } from "@/lib/config";
import { getAuthPlugin, initializePlugins } from "@/lib/plugins";

function getConfiguredProviderIds(config: Awaited<ReturnType<typeof getConfig>>): string[] {
  if (config.auth.providers && config.auth.providers.length > 0) {
    return config.auth.providers;
  }
  if (config.auth.provider) {
    return [config.auth.provider];
  }
  return ["credentials"];
}

export async function getEnabledAuthProviderIds(): Promise<string[]> {
  initializePlugins();
  const config = await getConfig();
  const configured = getConfiguredProviderIds(config);

  const enabled = configured.filter((id) => {
    const plugin = getAuthPlugin(id);
    if (!plugin) return false;
    if (!plugin.isConfigured) return true;
    return plugin.isConfigured();
  });

  return enabled.length > 0 ? enabled : ["credentials"];
}

