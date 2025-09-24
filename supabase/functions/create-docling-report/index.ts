// @ts-ignore: Deno-specific URL import
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// --- Docling Tool Placeholders ---
// In a real production environment, these functions would interact with the
// actual Docling service to create and manipulate structured documents.

const Docling__create_new_docling_document = async ({ prompt }: { prompt: string }): Promise<{ document_key: string }> => {
  console.log(`PROD_LOG: Creating new Docling document for: "${prompt}"`);
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network latency
  const document_key = `doc_${crypto.randomUUID()}`;
  console.log(`PROD_LOG: Generated document key: ${document_key}`);
  return { document_key };
};

const Docling__add_title_to_docling_document = async ({ document_key, title }: { document_key: string, title: string }): Promise<void> => {
  console.log(`PROD_LOG: Adding title "${title}" to document ${document_key}`);
  await new Promise(resolve => setTimeout(resolve, 100));
};

const Docling__add_section_heading_to_docling_document = async ({ document_key, section_heading }: { document_key: string, section_heading: string }): Promise<void> => {
  console.log(`PROD_LOG: Adding section "${section_heading}" to document ${document_key}`);
  await new Promise(resolve => setTimeout(resolve, 100));
};

const Docling__add_table_in_html_format_to_docling_document = async ({ document_key, html_table }: { document_key: string, html_table: string }): Promise<void> => {
  console.log(`PROD_LOG: Adding HTML table to document ${document_key}`);
  await new Promise(resolve => setTimeout(resolve, 200));
};

const Docling__export_document_to_pdf = async ({ document_key }: { document_key: string }): Promise<{ download_url: string }> => {
  console.log(`PROD_LOG: Starting PDF export for document: ${document_key}`);
  // In a real production environment, this step would involve a potentially
  // long-running process. It would generate a PDF, store it in a secure
  // cloud storage (like Supabase Storage), and return a temporary, secure URL.
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate PDF generation time

  // For demonstration, we return a link to a placeholder PDF.
  // PRODUCTION TODO: Replace this with your actual PDF generation and storage logic.
  const download_url = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
  console.log(`PROD_LOG: PDF generated. Download URL: ${download_url}`);
  return { download_url };
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
      return new Response(JSON.stringify({ error: 'Invalid request body: Missing reportTitle or tables.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Create a new Docling document to hold the report.
    const { document_key } = await Docling__create_new_docling_document({
      prompt: `Financial Report: ${reportTitle}`,
    });
    await Docling__add_title_to_docling_document({ document_key, title: reportTitle });

    // 2. Iterate through the tables from the frontend and add them to the document.
    for (const table of tables) {
      await Docling__add_section_heading_to_docling_document({
        document_key,
        section_heading: table.title,
      });
      await Docling__add_table_in_html_format_to_docling_document({
        document_key,
        html_table: table.html,
      });
    }

    // 3. Export the final document to a PDF and get the download URL.
    const { download_url } = await Docling__export_document_to_pdf({ document_key });

    // 4. Return the secure download URL to the client.
    return new Response(JSON.stringify({ document_key, download_url }), {
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