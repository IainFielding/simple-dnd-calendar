import { describe, expect, it } from "vitest";
import * as sky from "../scripts/sky.mjs";
import { makeCalendar } from "./helpers/foundry-shims.mjs";

const HOUR = 3600;
const DAY = 24 * HOUR;

/** Twelve 30-day months, with Harptos-style seasons counted in days, one of them running over the new year. */
const calendar = makeCalendar({
  months: Array.from({ length: 12 }, (_, i) => ({ name: `Month ${i + 1}`, ordinal: i + 1, days: 30 })),
  seasons: [
    { name: "DND5E.CALENDAR.Harptos.Season.Spring", dayStart: 79, dayEnd: 171 },
    { name: "DND5E.CALENDAR.Harptos.Season.Summer", dayStart: 172, dayEnd: 263 },
    { name: "DND5E.CALENDAR.Harptos.Season.Fall", dayStart: 264, dayEnd: 353 },
    { name: "DND5E.CALENDAR.Harptos.Season.Winter", dayStart: 354, dayEnd: 78 }
  ]
});

describe("the day wheel", () => {
  it("measures the day from midnight", () => {
    expect(sky.dayFraction(calendar, 0)).toBe(0);
    expect(sky.dayFraction(calendar, 12 * HOUR)).toBe(0.5);
    expect(sky.dayFraction(calendar, (3 * DAY) + (18 * HOUR))).toBe(0.75);
  });

  it("measures times before the epoch the same way", () => {
    expect(sky.dayFraction(calendar, -6 * HOUR)).toBe(0.75);
  });

  it("turns the day half down at noon and the night half down at midnight", () => {
    expect(sky.wheelRotation(0.5)).toBe(0);
    expect(Math.abs(sky.wheelRotation(0))).toBe(180);
    expect(sky.wheelRotation(0.25)).toBe(-90);
    expect(sky.wheelRotation(0.75)).toBe(90);
  });

  it("names the part of the day", () => {
    expect(sky.dayPhase(2)).toBe("night");
    expect(sky.dayPhase(5)).toBe("dawn");
    expect(sky.dayPhase(6)).toBe("dawn");
    expect(sky.dayPhase(6.5)).toBe("day");
    expect(sky.dayPhase(18)).toBe("dusk");
    expect(sky.dayPhase(19)).toBe("dusk");
    expect(sky.dayPhase(19.5)).toBe("night");
  });

  it("follows the calendar's own sunrise and sunset", () => {
    expect(sky.dayPhase(6.5, 8, 16)).toBe("night");
    expect(sky.dayPhase(7.5, 8, 16)).toBe("dawn");
    expect(sky.dayPhase(16.5, 8, 16)).toBe("dusk");
  });

  it("puts the sun on the right-hand horizon at sunrise, overhead at noon and on the left at sunset", () => {
    expect(sky.sunSkyAngle(0.25)).toBeCloseTo(0);
    expect(sky.sunSkyAngle(0.5)).toBeCloseTo(Math.PI / 2);
    expect(sky.sunSkyAngle(0.75)).toBeCloseTo(Math.PI);
  });
});

describe("the season band", () => {
  it("reads the seasons' days, counted from 0 with the end exclusive", () => {
    expect(sky.seasonRanges(calendar).map(({ start, end }) => [start, end])).toEqual([
      [78, 171], [171, 263], [263, 353], [353, 78]
    ]);
  });

  it("reads seasons given in months", () => {
    const gregorian = makeCalendar({
      months: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31].map((days, i) => ({ ordinal: i + 1, days })),
      seasons: [
        { name: "CALENDAR.GREGORIAN.Spring", monthStart: 3, monthEnd: 5 },
        { name: "CALENDAR.GREGORIAN.Winter", monthStart: 12, monthEnd: 2 }
      ]
    });
    expect(sky.seasonRanges(gregorian).map(({ start, end }) => [start, end])).toEqual([[59, 151], [334, 59]]);
  });

  it("knows a season by its name", () => {
    expect(sky.seasonKind("DND5E.CALENDAR.Harptos.Season.Fall")).toBe("fall");
    expect(sky.seasonKind("Autumn")).toBe("fall");
    expect(sky.seasonKind("CALENDAR.GREGORIAN.Winter")).toBe("winter");
    expect(sky.seasonKind("The Long Dark")).toBeNull();
  });

  it("blends each season into the next, carried over the new year", () => {
    const gradient = sky.seasonGradient(calendar);
    expect(gradient.startsWith("linear-gradient(90deg, ")).toBe(true);
    const stops = [...gradient.matchAll(/(#[0-9a-f]{6}) (-?[\d.]+)%/g)].map(([, color, at]) => [color, Number(at)]);
    expect(stops).toHaveLength(6);
    // Winter's middle falls in the first days of the year, so it is the first stop inside the year and also wraps
    // round as the last stop after it.
    expect(stops[1][0]).toBe(sky.SEASON_COLORS.winter);
    expect(stops.at(-1)[0]).toBe(sky.SEASON_COLORS.winter);
    expect(stops.at(-1)[1] - stops[1][1]).toBeCloseTo(100);
    expect(stops.map(([, at]) => at)).toEqual([...stops.map(([, at]) => at)].sort((a, b) => a - b));
  });

  it("draws a plain band for a calendar without seasons", () => {
    expect(sky.seasonGradient(makeCalendar({ months: [{ ordinal: 1, days: 100 }] }))).toMatch(/^linear-gradient/);
  });

  it("measures the year from its first moment", () => {
    expect(sky.yearFraction(calendar, { day: 180 }, 0)).toBe(0.5);
    expect(sky.yearFraction(calendar, { day: 0 }, 0.5)).toBeCloseTo(0.5 / 360);
  });
});

describe("the moons", () => {
  const moon = { id: "test", name: "Test", period: 30, color: "#fff", epoch: { year: 0, day: 10, hour: 12 } };

  it("is in its epoch phase at its epoch", () => {
    const epoch = sky.epochTime(calendar, moon);
    expect(epoch).toBe((10 * DAY) + (12 * HOUR));
    expect(sky.moonPhase(calendar, moon, epoch)).toBe(0);
    expect(sky.moonPhase(calendar, { ...moon, epochPhase: 0.5 }, epoch)).toBe(0.5);
  });

  it("goes through its phases over its period, before and after its epoch", () => {
    const epoch = sky.epochTime(calendar, moon);
    expect(sky.moonPhase(calendar, moon, epoch + (15 * DAY))).toBeCloseTo(0.5);
    expect(sky.moonPhase(calendar, moon, epoch + (30 * DAY))).toBeCloseTo(0);
    expect(sky.moonPhase(calendar, moon, epoch - (7.5 * DAY))).toBeCloseTo(0.75);
  });

  it("counts its epoch's year as the calendar shows it", () => {
    const shifted = makeCalendar({ months: calendar.months.values, yearZero: 1500 });
    expect(sky.epochTime(shifted, { ...moon, epoch: { year: 1502 } })).toBe(2 * 360 * DAY);
  });

  it("names its phase", () => {
    expect(sky.phaseName(0)).toBe("New");
    expect(sky.phaseName(0.97)).toBe("New");
    expect(sky.phaseName(0.25)).toBe("FirstQuarter");
    expect(sky.phaseName(0.5)).toBe("Full");
    expect(sky.phaseName(0.6)).toBe("WaningGibbous");
    expect(sky.phaseName(0.75)).toBe("LastQuarter");
  });

  it("is lit from none at new to all at full", () => {
    expect(sky.illumination(0)).toBeCloseTo(0);
    expect(sky.illumination(0.25)).toBeCloseTo(0.5);
    expect(sky.illumination(0.5)).toBeCloseTo(1);
  });

  it("rides highest at midnight when full, and keeps company with the sun when new", () => {
    expect(sky.moonSkyAngle(0, 0.5)).toBeCloseTo(Math.PI / 2);
    expect(sky.moonSkyAngle(0.5, 0)).toBeCloseTo(Math.PI / 2);
    expect(sky.aboveHorizon(sky.moonSkyAngle(0.5, 0.5))).toBe(false);
  });

  it("rides highest around dawn at last quarter", () => {
    expect(sky.moonSkyAngle(0.25, 0.75)).toBeCloseTo(Math.PI / 2);
  });

  it("is above the horizon only between rising and setting", () => {
    expect(sky.aboveHorizon(0)).toBe(false);
    expect(sky.aboveHorizon(1)).toBe(true);
    expect(sky.aboveHorizon(Math.PI)).toBe(false);
    expect(sky.aboveHorizon(4)).toBe(false);
  });

  it("finds its place on the bowl", () => {
    expect(sky.orbitPoint(Math.PI / 2, { x: 160, y: -40, r: 128 })).toEqual({ x: 160, y: 88 });
    expect(sky.orbitPoint(0, { x: 160, y: -40, r: 128 })).toEqual({ x: 288, y: -40 });
  });

  describe("its lit face", () => {
    const sweeps = path => [...path.matchAll(/A[\d.]+ [\d.]+ 0 0 (\d)/g)].map(m => Number(m[1]));
    const terminatorWidth = path => Number(path.match(/A([\d.]+) [\d.]+ 0 0 \d [\d.]+ 0Z$/)[1]);

    it("is not drawn at new moon", () => {
      expect(sky.moonPath(0, 10)).toBe("");
    });

    it("is a whole disc at full moon", () => {
      expect(terminatorWidth(sky.moonPath(0.5, 10))).toBe(10);
    });

    it("is lit from the right while waxing and from the left while waning", () => {
      expect(sweeps(sky.moonPath(0.1, 10))[0]).toBe(1);
      expect(sweeps(sky.moonPath(0.9, 10))[0]).toBe(0);
    });

    it("bulges its terminator towards the light as a crescent and away as gibbous", () => {
      expect(sweeps(sky.moonPath(0.1, 10))[1]).toBe(0); // Waxing crescent: terminator bows right.
      expect(sweeps(sky.moonPath(0.4, 10))[1]).toBe(1); // Waxing gibbous: bows left.
      expect(sweeps(sky.moonPath(0.9, 10))[1]).toBe(1); // Waning crescent: bows left.
      expect(sweeps(sky.moonPath(0.6, 10))[1]).toBe(0); // Waning gibbous: bows right.
    });

    it("has a straight terminator at the quarters", () => {
      expect(terminatorWidth(sky.moonPath(0.25, 10))).toBe(0);
      expect(terminatorWidth(sky.moonPath(0.75, 10))).toBe(0);
    });
  });
});
