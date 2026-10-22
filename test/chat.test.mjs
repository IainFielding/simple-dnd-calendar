import { describe, expect, it } from "vitest";
import { parseDuration } from "../scripts/chat.mjs";
import { makeCalendar } from "./helpers/foundry-shims.mjs";

const HOUR = 3600;
const DAY = 24 * HOUR;

const calendar = makeCalendar({ months: [{ ordinal: 1, days: 365 }] });
calendar.days.values = Array.from({ length: 10 }, (_, i) => ({ name: `Day ${i + 1}` }));

describe("durations in chat commands", () => {
  it("reads an amount and a unit", () => {
    expect(parseDuration("8 hours", calendar)).toBe(8 * HOUR);
    expect(parseDuration("90 minutes", calendar)).toBe(90 * 60);
    expect(parseDuration("1 day", calendar)).toBe(DAY);
    expect(parseDuration("30 s", calendar)).toBe(30);
  });

  it("reads several amounts, written long or short", () => {
    expect(parseDuration("1 day 6 hours", calendar)).toBe(DAY + (6 * HOUR));
    expect(parseDuration("1d 6h", calendar)).toBe(DAY + (6 * HOUR));
    expect(parseDuration("2 hours, 30 minutes", calendar)).toBe(2.5 * HOUR);
    expect(parseDuration("1 hour and 15 mins", calendar)).toBe(1.25 * HOUR);
  });

  it("counts a week as the calendar's week", () => {
    expect(parseDuration("1 week", calendar)).toBe(10 * DAY);
  });

  it("reads a number on its own as hours", () => {
    expect(parseDuration("3", calendar)).toBe(3 * HOUR);
    expect(parseDuration("1.5", calendar)).toBe(1.5 * HOUR);
  });

  it("turns down anything else", () => {
    expect(parseDuration("", calendar)).toBe(null);
    expect(parseDuration("soon", calendar)).toBe(null);
    expect(parseDuration("3 fortnights", calendar)).toBe(null);
    expect(parseDuration("-2 hours", calendar)).toBe(null);
  });
});
