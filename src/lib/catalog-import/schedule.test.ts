import { catalogDayBounds, catalogRunStamp } from "./schedule";

describe("catalog schedule time boundaries", () => {
  it("uses the Melbourne calendar date for run directories", () => {
    expect(catalogRunStamp(new Date("2026-08-25T23:00:00.000Z"))).toBe("2026-08-26-090000");
  });

  it("uses Melbourne standard-time day boundaries", () => {
    const bounds = catalogDayBounds(new Date("2026-08-26T02:00:00.000Z"));
    expect(bounds.start.toISOString()).toBe("2026-08-25T14:00:00.000Z");
    expect(bounds.end.toISOString()).toBe("2026-08-26T14:00:00.000Z");
  });

  it("uses Melbourne daylight-saving day boundaries", () => {
    const bounds = catalogDayBounds(new Date("2026-12-26T02:00:00.000Z"));
    expect(bounds.start.toISOString()).toBe("2026-12-25T13:00:00.000Z");
    expect(bounds.end.toISOString()).toBe("2026-12-26T13:00:00.000Z");
  });

  it("allows for Melbourne's 23-hour daylight-saving transition day", () => {
    const bounds = catalogDayBounds(new Date("2026-10-04T01:00:00.000Z"));
    expect(bounds.start.toISOString()).toBe("2026-10-03T14:00:00.000Z");
    expect(bounds.end.toISOString()).toBe("2026-10-04T13:00:00.000Z");
  });
});
