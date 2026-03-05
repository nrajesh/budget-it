import { useState, useEffect, useCallback } from "react";
import { AIProvider } from "@/types/dataProvider";
import { useDataProvider } from "@/context/DataProviderContext";

export interface AIConfig {
  provider: AIProvider | null;
  apiKey: string;
}

export const useAIConfig = () => {
  const dataProvider = useDataProvider();
  const [config, setConfig] = useState<AIConfig>({
    provider: null,
    apiKey: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  const refreshConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const providers = await dataProvider.getAIProviders();
      const activeProvider =
        providers.find((p) => p.isDefault) || providers[0] || null;

      let apiKey = "";
      if (activeProvider) {
        apiKey =
          localStorage.getItem(`budgetit_ai_apiKey_${activeProvider.id}`) || "";
      }

      setConfig({
        provider: activeProvider,
        apiKey,
      });
    } catch (error) {
      console.error("Failed to load AI config", error);
    } finally {
      setIsLoading(false);
    }
  }, [dataProvider]);

  useEffect(() => {
    refreshConfig();
  }, [refreshConfig]);

  const saveConfig = async (providerId: string, newApiKey: string) => {
    localStorage.setItem(`budgetit_ai_apiKey_${providerId}`, newApiKey);
    await refreshConfig();
  };

  return {
    config,
    saveConfig,
    refreshConfig,
    isLoading,
  };
};
