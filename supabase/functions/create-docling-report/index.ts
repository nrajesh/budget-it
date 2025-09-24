// @ts-ignore: Deno-specific URL import
import { serve } from "https://deno.land/std@0.190.0/http/server.ts"

// These are placeholder functions for the Docling tools.
// In a real environment, these would be provided by the platform.
const Docling__create_new_docling_document = async ({ prompt }: { prompt: string }): Promise<{ document_key: string }> => {
  console.log(`Creating new Docling document with prompt: "${prompt}"`);
  // Simulate a delay and generate a unique key
  await new Promise(resolve => setTimeout(resolve, 500));
  const document_key = `doc_${crypto.randomUUID()}`;
  console.log(`Generated document key: ${document_key}`);
  return { document_key };
};

const Docling__add_content_to_docling_document = async ({ document_key, content_type, content }: { document_key: string, content_type: string, content: string }): Promise<{ success: boolean }> => {
  console.log(`Adding content to document ${document_key}:`);
  console.log(`  Type: ${content_type}`);
  console.log(`  Content: ${content.substring(0, 100)}...`);
  // Simulate a delay
  await new Promise(resolve => setTimeout(resolve, 200));
  return { success: true };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { reportTitle, tables } = await req.json();

    if (!reportTitle || !tables || !Array.isArray(tables)) {
      return new Response(JSON.stringify({ error: 'Missing reportTitle or tables' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Create a new Docling document
    const { document_key } = await Docling__create_new_docling_document({
      prompt: `Financial Report: ${reportTitle}`,
    });

    // 2. Add content for each table to the document
    for (const table of tables) {
      // Add table title as a heading
      await Docling__add_content_to_docling_document({
        document_key,
        content_type: 'h2',
        content: table.title,
      });
      // Add the table HTML
      await Docling__add_content_to_docling_document({
        document_key,
        content_type: 'html',
        content: table.html,
      });
    }

    return new Response(JSON.stringify({ document_key }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})