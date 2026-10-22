import { describe, expect, it } from "vitest";
import { BAR_OUTLINE, BOWL_OUTLINE, festivalTrimKind, frameTrim, TRIM_CHOICES, TRIM_GROUPS, trimKind }
  from "../scripts/trim.mjs";

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
      const trim = frameTrim(kind);
      expect(trim.bar).toContain(piece);
      expect(trim.bowl).toContain(piece);
      expect(trim.bowl).not.toContain("middle");
    }
  });

  it("leaves the bar over the date marked, so it can be left bare", () => {
    expect(frameTrim("fall").bar).toContain(" middle");
  });

  it("comes out the same each time", () => {
    expect(frameTrim("spring")).toEqual(frameTrim("spring"));
  });

  it("draws nothing for a season of no known kind", () => {
    expect(frameTrim(null)).toEqual({ bar: "", bowl: "" });
  });
});

describe("the festivals' and adventures' trim", () => {
  it("dresses the frame for each festival of D&D 5e's calendars", () => {
    const festivals = {
      "DND5E.CALENDAR.Harptos.Festival.Midwinter": "midwinter",
      "DND5E.CALENDAR.Greyhawk.Festival.Needfest": "midwinter",
      "DND5E.CALENDAR.Harptos.Festival.Greengrass": "greengrass",
      "DND5E.CALENDAR.Greyhawk.Festival.Growfest": "greengrass",
      "DND5E.CALENDAR.Harptos.Festival.Midsummer": "midsummer",
      "DND5E.CALENDAR.Greyhawk.Festival.Richfest": "midsummer",
      "DND5E.CALENDAR.Harptos.Festival.Shieldmeet": "shieldmeet",
      "DND5E.CALENDAR.Harptos.Festival.Highharvestide": "harvest",
      "DND5E.CALENDAR.Greyhawk.Festival.Brewfest": "harvest",
      "DND5E.CALENDAR.Harptos.Festival.FeastOfTheMoon": "moonfeast"
    };
    for ( const [name, kind] of Object.entries(festivals) ) {
      expect(festivalTrimKind(name)).toBe(kind);
      const trim = frameTrim(kind);
      expect(trim.bar).not.toBe("");
      expect(trim.bowl).not.toBe("");
    }
    expect(festivalTrimKind("")).toBeNull();
  });

  it("dresses the bar alone for each adventure", () => {
    for ( const kind of TRIM_GROUPS.adventures ) {
      const trim = frameTrim(kind);
      expect(trim.bar, kind).toMatch(/^<.*>$/s);
      expect(trim.bar, kind).not.toMatch(/NaN|undefined/);
      expect(trim.bowl, kind).toBe("");
    }
  });

  it("draws no festival or season with NaN or undefined in it", () => {
    for ( const kind of ["winter", "spring", "summer", "fall", "midwinter", "greengrass", "midsummer", "shieldmeet",
      "harvest", "moonfeast"] ) {
      const { bar, bowl } = frameTrim(kind);
      expect(bar + bowl, kind).not.toMatch(/NaN|undefined/);
    }
  });
});

describe("the GM's choice of trim", () => {
  it("offers every choice once", () => {
    expect(new Set(TRIM_CHOICES).size).toBe(TRIM_CHOICES.length);
    expect(TRIM_CHOICES.slice(0, 2)).toEqual(["none", "follow"]);
  });

  it("puts up a festival's trim for the day while following the seasons", () => {
    expect(trimKind("follow", "winter", "midwinter")).toBe("midwinter");
    expect(trimKind("winter", "winter", "midwinter")).toBe("winter");
    expect(trimKind("ravenloft", "winter", "midwinter")).toBe("ravenloft");
    expect(trimKind("none", "winter", "midwinter")).toBeNull();
  });

  it("is bare by default", () => {
    expect(trimKind("none", "winter")).toBeNull();
  });

  it("follows the seasons", () => {
    expect(trimKind("follow", "spring")).toBe("spring");
    expect(trimKind("follow", null)).toBeNull();
  });

  it("keeps to one season all year", () => {
    for ( const kind of ["winter", "spring", "summer", "fall"] ) expect(trimKind(kind, "summer")).toBe(kind);
  });

  it("follows the seasons for a world that turned the old setting on", () => {
    expect(trimKind(true, "fall")).toBe("fall");
    expect(trimKind("true", "fall")).toBe("fall");
    expect(trimKind(false, "fall")).toBeNull();
  });
});
