import { knownToolError } from "./http";

describe("knownToolError", () => {
  it("links only a published listing", () => {
    const error = knownToolError({ slug: "granola", name: "Granola", status: "published" });
    expect(error.status).toBe(409);
    expect(error.details).toEqual({ existingTool: { slug: "granola", name: "Granola" } });
  });

  it("reports a submission still in review without a link", () => {
    const error = knownToolError({ slug: "new-tool", name: "New Tool", status: "pending_review" });
    expect(error.message).toBe("New Tool has already been submitted and is being reviewed.");
    expect(error.details).toBeUndefined();
  });

  it("does not reveal rejected or archived listings", () => {
    expect(knownToolError({ slug: "old", name: "Old", status: "archived" }).details).toBeUndefined();
  });
});
