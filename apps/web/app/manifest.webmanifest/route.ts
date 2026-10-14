import { buildManifest } from "@/lib/manifest";

export function GET() {
  return Response.json(buildManifest(), {
    headers: { "content-type": "application/manifest+json" },
  });
}
