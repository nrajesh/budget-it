import { useAIConfig } from "./useAIConfig";
import { Category, SubCategory } from "@/types/dataProvider";
import { Transaction } from "@/data/finance-data";

export interface CategorizeResult {
  categoryName: string;
  subCategoryName: string;
}

const buildPrompt = (
  vendorName: string,
  categories: Category[],
  subCategories: SubCategory[],
) => {
  const categoriesContext = categories
    .map((c) => {
      const subs = subCategories
        .filter((sc) => sc.category_id === c.id)
        .map((sc) => sc.name);
      return `Category: "${c.name}", SubCategories: [${subs.join(", ")}]`;
    })
    .join("\n");

  return `
You are a financial categorization assistant. Given a vendor/payee name and a user's existing list of categories and sub-categories, your job is to guess the best matching category and (optionally) sub-category for this vendor.

User's Existing Categories:
${categoriesContext}

Vendor/Payee Name: "${vendorName}"

Instructions:
1. Try to match the vendor to one of the user's existing categories.
2. Try to match the vendor to one of the user's existing sub-categories within that category.
3. If no good match exists, propose a generic existing category like "Miscellaneous" or "Shopping".
4. Return ONLY a valid JSON object matching this schema exactly, with NO markdown formatting, NO backticks, and NO additional text.
Schema: { "categoryName": "string", "subCategoryName": "string" }
Example Output: { "categoryName": "Food", "subCategoryName": "Groceries" }
  `.trim();
};

export type BulkCategorizeResult = Record<string, CategorizeResult>;

const buildBulkPrompt = (
  vendorNames: string[],
  categories: Category[],
  subCategories: SubCategory[],
) => {
  const categoriesContext = categories
    .map((c) => {
      const subs = subCategories
        .filter((sc) => sc.category_id === c.id)
        .map((sc) => sc.name);
      return `Category: "${c.name}", SubCategories: [${subs.join(", ")}]`;
    })
    .join("\n");

  return `
You are a financial categorization assistant. Given a list of vendor/payee names and a user's existing list of categories and sub-categories, your job is to guess the best matching category and (optionally) sub-category for EACH vendor.

User's Existing Categories:
${categoriesContext}

Vendors/Payees to Categorize:
${JSON.stringify(vendorNames)}

Instructions:
1. For each vendor, try to match it to one of the user's existing categories and sub-categories.
2. If no good match exists, propose a generic existing category like "Miscellaneous" or "Shopping".
3. Return ONLY a valid JSON object matching this schema exactly, with NO markdown formatting, NO backticks, and NO additional text.
Schema: { "Vendor Name 1": { "categoryName": "string", "subCategoryName": "string" }, "Vendor Name 2": ... }
Example Output: { "Starbucks": { "categoryName": "Dining Out", "subCategoryName": "Coffee" } }
  `.trim();
};

export const useAutoCategorize = () => {
  const { config } = useAIConfig();

  const getHistoricalMapping = (
    vendorName: string,
    transactions: Transaction[],
  ): CategorizeResult | null => {
    if (!vendorName || !vendorName.trim()) return null;

    // Find the most recent transaction with this vendor that has a category
    const match = transactions.find(
      (t) =>
        t.vendor?.toLowerCase() === vendorName.toLowerCase() &&
        t.category &&
        t.category.toLowerCase() !== "uncategorized",
    );

    if (match) {
      return {
        categoryName: match.category,
        subCategoryName: match.sub_category || "",
      };
    }
    return null;
  };

  const autoCategorize = async (
    vendorName: string,
    categories: Category[],
    subCategories: SubCategory[],
  ): Promise<CategorizeResult> => {
    if (!config.apiKey || config.provider === "NONE") {
      throw new Error("AI Provider or API Key is not configured.");
    }

    if (!navigator.onLine) {
      throw new Error("You must be online to use Auto-Categorize.");
    }

    const prompt = buildPrompt(vendorName, categories, subCategories);
    let resultJson = "";

    try {
      if (config.provider === "OPENAI") {
        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-4o-mini", // Using a fast, cheap model
              messages: [{ role: "user", content: prompt }],
              temperature: 0.1,
              response_format: { type: "json_object" },
            }),
          },
        );

        if (!response.ok)
          throw new Error(`OpenAI Error: ${response.statusText}`);
        const data = await response.json();
        resultJson = data.choices[0].message.content;
      } else if (config.provider === "GEMINI") {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${config.apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.1,
                responseMimeType: "application/json",
              },
            }),
          },
        );

        if (!response.ok)
          throw new Error(`Gemini Error: ${response.statusText}`);
        const data = await response.json();
        resultJson = data.candidates[0].content.parts[0].text;
      } else if (config.provider === "PERPLEXITY") {
        const response = await fetch(
          "https://api.perplexity.ai/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
              model: "sonar-reasoning-pro",
              messages: [{ role: "user", content: prompt }],
              temperature: 0.1,
            }),
          },
        );

        if (!response.ok)
          throw new Error(`Perplexity Error: ${response.statusText}`);
        const data = await response.json();
        resultJson = data.choices[0].message.content;

        // Perplexity doesn't force JSON, so we strip markdown if present
        if (resultJson.startsWith("```json")) {
          resultJson = resultJson
            .replace(/^```json\s*/, "")
            .replace(/\s*```$/, "");
        } else if (resultJson.startsWith("```")) {
          resultJson = resultJson.replace(/^```\s*/, "").replace(/\s*```$/, "");
        }
      }

      const parsed = JSON.parse(resultJson);
      return {
        categoryName: parsed.categoryName || "",
        subCategoryName: parsed.subCategoryName || "",
      };
    } catch (error: unknown) {
      console.error("AutoCategorize Error:", error);
      throw new Error(
        (error as Error).message || "Failed to parse AI response.",
      );
    }
  };

  const autoCategorizeBulk = async (
    vendorNames: string[],
    categories: Category[],
    subCategories: SubCategory[],
  ): Promise<BulkCategorizeResult> => {
    if (!config.apiKey || config.provider === "NONE") {
      throw new Error("AI Provider or API Key is not configured.");
    }
    if (!navigator.onLine) {
      throw new Error("You must be online to use Auto-Categorize.");
    }

    const prompt = buildBulkPrompt(vendorNames, categories, subCategories);
    let resultJson = "";

    try {
      if (config.provider === "OPENAI") {
        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [{ role: "user", content: prompt }],
              temperature: 0.1,
              response_format: { type: "json_object" },
            }),
          },
        );

        if (!response.ok)
          throw new Error(`OpenAI Error: ${response.statusText}`);
        const data = await response.json();
        resultJson = data.choices[0].message.content;
      } else if (config.provider === "GEMINI") {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${config.apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.1,
                responseMimeType: "application/json",
              },
            }),
          },
        );

        if (!response.ok)
          throw new Error(`Gemini Error: ${response.statusText}`);
        const data = await response.json();
        resultJson = data.candidates[0].content.parts[0].text;
      } else if (config.provider === "PERPLEXITY") {
        const response = await fetch(
          "https://api.perplexity.ai/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
              model: "sonar-reasoning-pro",
              messages: [{ role: "user", content: prompt }],
              temperature: 0.1,
            }),
          },
        );

        if (!response.ok)
          throw new Error(`Perplexity Error: ${response.statusText}`);
        const data = await response.json();
        resultJson = data.choices[0].message.content;

        if (resultJson.startsWith("```json")) {
          resultJson = resultJson
            .replace(/^```json\s*/, "")
            .replace(/\s*```$/, "");
        } else if (resultJson.startsWith("```")) {
          resultJson = resultJson.replace(/^```\s*/, "").replace(/\s*```$/, "");
        }
      }

      const parsed = JSON.parse(resultJson);
      return parsed as BulkCategorizeResult;
    } catch (error: unknown) {
      console.error("AutoCategorizeBulk Error:", error);
      throw new Error(
        (error as Error).message || "Failed to parse AI response.",
      );
    }
  };

  return { autoCategorize, autoCategorizeBulk, getHistoricalMapping };
};
