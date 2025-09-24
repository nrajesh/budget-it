// @ts-ignore: Deno-specific URL import, safe to ignore in this context
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// --- Docling Tool Placeholders ---
// In a production environment, these would be calls to a dedicated document
// processing API like Docling to create, structure, and export documents.

const Docling = {
  async createNewDocument(prompt: string): Promise<{ document_key: string }> {
    console.log(`PROD_LOG: Initializing new document for: "${prompt}"`);
    // Simulate API call latency
    await new Promise(resolve => setTimeout(resolve, 250));
    const document_key = `doc_${crypto.randomUUID()}`;
    console.log(`PROD_LOG: Document created with key: ${document_key}`);
    return { document_key };
  },

  async addTitle(document_key: string, title: string): Promise<void> {
    console.log(`PROD_LOG: Adding title "${title}" to document ${document_key}`);
    await new Promise(resolve => setTimeout(resolve, 50));
  },

  async addSectionHeading(document_key: string, heading: string): Promise<void> {
    console.log(`PROD_LOG: Adding section "${heading}" to document ${document_key}`);
    await new Promise(resolve => setTimeout(resolve, 50));
  },

  async addHtmlTable(document_key: string, html: string): Promise<void> {
    console.log(`PROD_LOG: Adding HTML table to document ${document_key}`);
    await new Promise(resolve => setTimeout(resolve, 100));
  },

  async exportToPdf(document_key: string): Promise<{ download_url: string }> {
    console.log(`PROD_LOG: Starting PDF export for document: ${document_key}`);
    // This simulates a potentially long-running process where the document is
    // rendered, a PDF is generated, and then stored in a secure location
    // (like Supabase Storage) to create a temporary, secure download URL.
    await new Promise(resolve => setTimeout(resolve, 1500));

    // PRODUCTION TODO: Replace this placeholder with actual PDF generation and storage logic.
    const download_url = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
    console.log(`PROD_LOG: PDF generated. Download URL: ${download_url}`);
    return { download_url };
  }
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reportTitle, tables } = await req.json();

    if (!reportTitle || !tables || !Array.isArray(tables)) {
      return new Response(JSON.stringify({ error: 'Invalid request: Missing reportTitle or tables.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Create a new Docling document to hold the report.
    const { document_key } = await Docling.createNewDocument(`Financial Report: ${reportTitle}`);
    await Docling.addTitle(document_key, reportTitle);

    // 2. Add each table from the frontend as a new section in the document.
    for (const table of tables) {
      await Docling.addSectionHeading(document_key, table.title);
      await Docling.addHtmlTable(document_key, table.html);
    }

    // 3. Export the final document to a PDF and get the download URL.
    const { download_url } = await Docling.exportToPdf(document_key);

    // 4. Return the secure download URL to the client.
    return new Response(JSON.stringify({ download_url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("FATAL_ERROR: ", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});