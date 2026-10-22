import { describe, expect, it } from "vitest";
import { BAR_OUTLINE, BOWL_OUTLINE, seasonTrim } from "../scripts/trim.mjs";

describe("the season trim", () => {
  it("walks the bar's lower edge from corner to corner", () => {
    const start = BAR_OUTLINE.at(0);
    const middle = BAR_OUTLINE.at(BAR_OUTLINE.length / 2);
    const end = BAR_OUTLINE.at(BAR_OUTLINE.length);
    expect([start.x, start.y]).toEqual([1, expect.closeTo(0, 6)]);
    expect([middle.x, middle.y]).toEqual([expect.closeTo(300, 6), 39]);
    expect([end.x, end.y]).toEqual([599, expect.closeTo(0, 6)]);
    expect(middle.n).toBeCloseTo(Math.PI / 2);
  });

  it("walks the bowl's rim from the band down and back up", () => {
    expect(BOWL_OUTLINE.at(0).y).toBeCloseTo(0);
    expect(BOWL_OUTLINE.at(BOWL_OUTLINE.length / 2).y).toBeCloseTo(120);
    expect(BOWL_OUTLINE.at(BOWL_OUTLINE.length).y).toBeCloseTo(0);
  });

  it("dresses the frame for each kind of season", () => {
    const pieces = { winter: "sdc-icicle", spring: "sdc-blossom", summer: "sdc-sunflower", fall: "sdc-fallen" };
    for ( const [kind, piece] of Object.entries(pieces) ) {
      const trim = seasonTrim(kind);
      expect(trim.bar).toContain(piece);
      expect(trim.bowl).toContain(piece);
      expect(trim.bowl).not.toContain("middle");
    }
  });

  it("leaves the bar over the date marked, so it can be left bare", () => {
    expect(seasonTrim("fall").bar).toContain(" middle");
  });

  it("comes out the same each time", () => {
    expect(seasonTrim("spring")).toEqual(seasonTrim("spring"));
  });

  it("draws nothing for a season of no known kind", () => {
    expect(seasonTrim(null)).toEqual({ bar: "", bowl: "" });
  });
});
