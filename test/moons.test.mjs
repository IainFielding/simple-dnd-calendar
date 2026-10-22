import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MOONS } from "../scripts/moons.mjs";
import * as sky from "../scripts/sky.mjs";

const strings = JSON.parse(readFileSync(new URL("../lang/en.json", import.meta.url), "utf8"));
const lookup = key => key.split(".").reduce((o, k) => o?.[k], strings);

describe("the moon catalogue", () => {
  it("has moons for each of D&D 5e's calendars", () => {
    expect(Object.keys(MOONS).sort()).toEqual(["gregorian", "greyhawk", "harptos", "khorvaire"]);
    expect(MOONS.khorvaire).toHaveLength(12);
  });

  it("gives every moon a name in the language file, a period and a colour", () => {
    for ( const moon of Object.values(MOONS).flat() ) {
      expect(typeof lookup(moon.name), moon.name).toBe("string");
      expect(moon.period).toBeGreaterThan(0);
      expect(moon.color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("gives each moon in a calendar its own id", () => {
    for ( const moons of Object.values(MOONS) ) {
      expect(new Set(moons.map(m => m.id)).size).toBe(moons.length);
    }
  });

  it("names every phase and part of the day in the language file", () => {
    for ( const phase of sky.PHASES ) expect(typeof lookup(`SDC.MoonPhase.${phase}`), phase).toBe("string");
    for ( const phase of ["Dawn", "Day", "Dusk", "Night"] ) expect(typeof lookup(`SDC.Phase.${phase}`)).toBe("string");
    for ( const event of ["Full", "FullTogether", "New"] ) expect(typeof lookup(`SDC.MoonEvent.${event}`)).toBe("string");
  });

  it("puts Selûne's 1372 DR full moon three-quarters of a day before 1501 DR", () => {
    // Shieldmeet falls in the years divisible by four, so from the start of 1372 DR to the start of 1501 DR there are
    // 129 years of 365 days and 33 Shieldmeets.
    const days = (129 * 365) + 33;
    const [selune] = MOONS.harptos;
    expect(selune.period).toBe(30.4375);
    expect(sky.wrap(days, selune.period)).toBeCloseTo(0.75);
    expect(selune.epoch.hour).toBe(-0.75 * 24);
    expect(selune.epochPhase).toBe(0.5);
  });
});
