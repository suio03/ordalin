import { adminAccessErrorResponse, requireAdminAccess } from "@/lib/admin/access";
import {
  parseImportReviewFields,
  publishImportCandidate,
  rejectImportCandidate,
} from "@/lib/admin/imports";
import { getCloudflareRuntime } from "@/lib/cloudflare";

export const dynamic = "force-dynamic";

type ImportParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: ImportParams) {
  try {
    const runtime = await getCloudflareRuntime();
    const environment = runtime.env as CloudflareEnv & {
      CLOUDFLARE_ACCESS_TEAM_DOMAIN?: string;
      CLOUDFLARE_ACCESS_AUD?: string;
    };
    const identity = await requireAdminAccess(request.headers, environment);
    const id = (await params).id;
    if (!/^import_[a-zA-Z0-9-]+$/.test(id)) {
      return Response.json({ error: "Import candidate was not found." }, { status: 404 });
    }
    const body = await request.json() as { action?: unknown; fields?: unknown };
    const actor = identity.email ?? identity.id;
    if (body.action === "publish") {
      const fields = parseImportReviewFields(body.fields);
      const toolId = await publishImportCandidate(environment.DB, id, fields, actor);
      return Response.json({ status: "published", toolId });
    }
    if (body.action === "reject") {
      await rejectImportCandidate(environment.DB, id, actor);
      return Response.json({ status: "rejected" });
    }
    return Response.json({ error: "Review action is invalid." }, { status: 400 });
  } catch (error) {
    if (error instanceof Error && /Access|authentication|configured/.test(error.message)) {
      return adminAccessErrorResponse(error);
    }
    console.error("Import review failed", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Import review failed." },
      { status: 400 },
    );
  }
}
