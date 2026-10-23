import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CALENDAR_OF_EXANDRIA, CALENDAR_OF_KRYNN, CALENDARS } from "../scripts/calendars.mjs";
import { MOONS } from "../scripts/moons.mjs";
import * as sky from "../scripts/sky.mjs";
import { makeCalendar } from "./helpers/foundry-shims.mjs";

const strings = JSON.parse(readFileSync(new URL("../lang/en.json", import.meta.url), "utf8"));
const lookup = key => key.split(".").reduce((o, k) => o?.[k], strings);

/** The day of the year, counted from 0, of a day of a month, both counted from 1. */
const dayOfYear = (config, month, day) => config.months.values.slice(0, month - 1).reduce((n, m) => n + m.days, 0)
  + day - 1;

describe("the additional calendars", () => {
  it("each have a name, a hint, and moons", () => {
    for ( const [key, calendar] of Object.entries(CALENDARS) ) {
      expect(typeof lookup(calendar.label), calendar.label).toBe("string");
      expect(typeof lookup(calendar.hint), calendar.hint).toBe("string");
      expect(MOONS[key]?.length, key).toBeGreaterThan(0);
    }
  });

  it("have months that add up to the year, and every name in the language file", () => {
    for ( const { config } of Object.values(CALENDARS) ) {
      expect(config.months.values.reduce((n, m) => n + m.days, 0)).toBe(config.days.daysPerYear);
      const names = [config.months.values, config.days.values, config.seasons.values, config.festivals ?? []]
        .flat().map(v => v.name);
      for ( const name of names ) expect(typeof lookup(name), name).toBe("string");
    }
  });

  it("put every festival on a day of its month", () => {
    for ( const { config } of Object.values(CALENDARS) ) {
      for ( const { name, month, day } of config.festivals ?? [] ) {
        expect(day, name).toBeLessThanOrEqual(config.months.values[month - 1].days);
      }
    }
  });
});

describe("the Exandrian calendar", () => {
  it("is Tal'Dorei Reborn's year of 328 days in eleven months, from 836 PD", () => {
    expect(CALENDAR_OF_EXANDRIA.months.values.map(m => m.days)).toEqual([29, 30, 30, 31, 28, 31, 32, 29, 27, 29, 32]);
    expect(CALENDAR_OF_EXANDRIA.years.yearZero).toBe(836);
    expect(CALENDAR_OF_EXANDRIA.festivals).toHaveLength(21);
  });

  it("starts each season on the holiday that marks it, and leaves no day out", () => {
    const festival = key => CALENDAR_OF_EXANDRIA.festivals.find(f => f.name.endsWith(`.${key}`));
    const starts = ["RenewalFestival", "Zenith", "HarvestsClose", "BarrenEve"]
      .map(key => festival(key)).map(({ month, day }) => dayOfYear(CALENDAR_OF_EXANDRIA, month, day));
    const seasons = CALENDAR_OF_EXANDRIA.seasons.values;
    expect(seasons.map(s => s.dayStart)).toEqual(starts);
    seasons.forEach((season, i) => {
      const next = seasons[(i + 1) % seasons.length];
      expect(sky.wrap(season.dayEnd + 1, 328), season.name).toBe(next.dayStart);
    });
  });
});

describe("the Solamnic calendar", () => {
  it("is twelve months of four seven-day weeks, from 351 AC", () => {
    expect(CALENDAR_OF_KRYNN.months.values).toHaveLength(12);
    expect(CALENDAR_OF_KRYNN.months.values.every(m => m.days === 28)).toBe(true);
    expect(CALENDAR_OF_KRYNN.days.values).toHaveLength(7);
    expect(CALENDAR_OF_KRYNN.years.yearZero).toBe(351);
  });

  it("has Krynn's three moons full together as 351 AC begins, and next a year and a half later", () => {
    const calendar = makeCalendar({ months: CALENDAR_OF_KRYNN.months.values, yearZero: 351 });
    const day = 24 * 3600;
    const allFull = days => MOONS.krynn.every(m => sky.phaseName(sky.moonPhase(calendar, m, days * day)) === "Full");
    expect(allFull(0)).toBe(true);
    const next = Array.from({ length: 600 }, (_, i) => i + 1).find(allFull);
    expect(next).toBe(504);
    expect(next).toBe(1.5 * CALENDAR_OF_KRYNN.days.daysPerYear);
  });
});
