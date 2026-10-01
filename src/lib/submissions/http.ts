export class SubmissionError extends Error {
  constructor(
    message: string,
    readonly status = 400,
    readonly code = "invalid_submission",
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export function submissionErrorResponse(error: unknown) {
  if (error instanceof SubmissionError) {
    return Response.json(
      { error: error.message, code: error.code, ...error.details },
      { status: error.status },
    );
  }
  console.error("Submission request failed", error);
  return Response.json(
    { error: "The submission could not be completed.", code: "internal_error" },
    { status: 500 },
  );
}

export type KnownTool = { slug: string; name: string; status: string };

/** Only a published listing is linked; a submission still in review has no public page yet. */
export function knownToolError(tool: KnownTool) {
  if (tool.status === "published") {
    return new SubmissionError(`${tool.name} is already listed on Ordalin.`, 409, "duplicate_domain", { existingTool: { slug: tool.slug, name: tool.name } });
  }
  if (tool.status === "pending_review" || tool.status === "imported") {
    return new SubmissionError(`${tool.name} has already been submitted and is being reviewed.`, 409, "duplicate_domain");
  }
  return new SubmissionError(`${tool.name} cannot be submitted again.`, 409, "duplicate_domain");
}
