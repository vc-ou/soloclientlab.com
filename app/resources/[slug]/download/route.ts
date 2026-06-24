import { readFile } from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import { getResourceBySlug } from "@/lib/db";

function getMimeType(filePath: string) {
  if (filePath.endsWith(".pdf")) return "application/pdf";
  if (filePath.endsWith(".txt")) return "text/plain; charset=utf-8";
  if (filePath.endsWith(".md")) return "text/markdown; charset=utf-8";
  return "application/octet-stream";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const resource = await getResourceBySlug(slug);

  if (!resource || resource.delivery_mode !== "file" || !resource.delivery_url) {
    notFound();
  }

  const relativePath = resource.delivery_url.replace(/^\/+/, "");
  const publicDir = path.join(process.cwd(), "public");
  const filePath = path.resolve(publicDir, relativePath);

  if (!filePath.startsWith(`${publicDir}${path.sep}`) && filePath !== publicDir) {
    notFound();
  }

  let file: Buffer;

  try {
    file = await readFile(filePath);
  } catch {
    notFound();
  }

  const filename = path.basename(filePath);

  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": getMimeType(filePath),
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, max-age=0, must-revalidate"
    }
  });
}
