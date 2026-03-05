import { useState, useEffect } from "react";

export type AIProvider = "OPENAI" | "GEMINI" | "PERPLEXITY" | "NONE";

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
}

export const useAIConfig = () => {
  const [config, setConfig] = useState<AIConfig>({
    provider: "NONE",
    apiKey: "",
  });

  useEffect(() => {
    // Load config from localStorage on mount
    const storedProvider = localStorage.getItem("budgetit_ai_provider");
    const storedApiKey = localStorage.getItem("budgetit_ai_apiKey");

    if (storedProvider) {
      setConfig((prev) => ({
        ...prev,
        provider: storedProvider as AIProvider,
      }));
    }
    if (storedApiKey) {
      setConfig((prev) => ({
        ...prev,
        apiKey: storedApiKey,
      }));
    }
  }, []);

  const saveConfig = (newProvider: AIProvider, newApiKey: string) => {
    localStorage.setItem("budgetit_ai_provider", newProvider);
    localStorage.setItem("budgetit_ai_apiKey", newApiKey);
    setConfig({ provider: newProvider, apiKey: newApiKey });
  };

  return {
    config,
    saveConfig,
  };
};
