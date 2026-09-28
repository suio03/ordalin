import seed from "../../data/catalog.seed.json";

describe("task catalogue contract", () => {
  it("publishes the controlled five-task validation cohort", () => {
    expect(seed.tasks).toHaveLength(5);
    expect(new Set(seed.tasks.map((task) => task.slug)).size).toBe(5);
  });

  it("keeps every task useful, editorial, and linked to reviewed inventory", () => {
    const toolSlugs = new Set(seed.tools.map((tool) => tool.slug));

    for (const task of seed.tasks) {
      expect(task.outcome.trim()).not.toBe("");
      expect(task.guidance.trim()).not.toBe("");
      expect(task.tools.length).toBeGreaterThanOrEqual(3);
      expect(task.tools.length).toBeLessThanOrEqual(5);
      expect(new Set(task.tools.map((tool) => tool.slug)).size).toBe(
        task.tools.length,
      );

      for (const option of task.tools) {
        expect(toolSlugs.has(option.slug)).toBe(true);
        expect(option.bestFor.trim()).not.toBe("");
        expect(option.keyDifference.trim()).not.toBe("");
        expect(option.limitation.trim()).not.toBe("");
      }
    }
  });
});
