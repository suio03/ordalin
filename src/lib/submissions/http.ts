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
