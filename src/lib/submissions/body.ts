import { SubmissionError } from "./http";

export async function submissionFormData(request: Request, limit = 6_500_000) {
  if (Number(request.headers.get("content-length") ?? 0) > limit) throw new SubmissionError("Submission is too large.", 413, "request_too_large");
  const reader = request.body?.getReader();
  if (!reader) throw new SubmissionError("Submission is empty.", 400, "invalid_body");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) { await reader.cancel(); throw new SubmissionError("Submission is too large.", 413, "request_too_large"); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return await new Response(bytes, { headers: { "content-type": request.headers.get("content-type") ?? "" } }).formData(); }
  catch { throw new SubmissionError("Submission data could not be read.", 400, "invalid_body"); }
}
