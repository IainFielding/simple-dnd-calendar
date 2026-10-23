/**
 * The moons of each of D&D 5e's calendars, keyed by the calendar's value in `CONFIG.DND5E.calendar.calendars`.
 *
 * Each moon's phase is known at one moment, its epoch, and runs on from there at its period. Modules and world
 * scripts can change these, or add moons for their own calendars, in the `sogrom-simple-dnd-calendar.moons` hook,
 * which is passed this object and the world's calendar key before the calendar first draws.
 *
 * @import { MoonConfig } from "./sky.mjs"
 */

/** @type {Record<string, MoonConfig[]>} */
export const MOONS = {
  // Earth's Moon, from the new moon of 6 January 2000 at 18:14.
  gregorian: [
    { id: "moon", name: "SDC.Moon.Moon", period: 29.530589, color: "#ece9df", epoch: { year: 2000, day: 5, hour: 18.23 } }
  ],

  // Selûne turns every 30 days and 10½ hours, and was full at the start of 1372 DR. Counted forward through the
  // Shieldmeet years, that full moon recurs three-quarters of a day before the start of 1501 DR, where D&D 5e's
  // Calendar of Harptos begins. The Tears of Selûne follow her.
  harptos: [
    {
      id: "selune", name: "SDC.Moon.Selune", period: 30.4375, color: "#eef1ff",
      epoch: { year: 1501, day: 0, hour: -18 }, epochPhase: 0.5, trail: "tears"
    }
  ],

  // Oerth's two moons are both full on the fourth day of Needfest: great Luna every 28 days, and little blue-green
  // Celene every 91, once a season.
  greyhawk: [
    { id: "luna", name: "SDC.Moon.Luna", period: 28, color: "#f2efe1", epoch: { year: 576, day: 3 }, epochPhase: 0.5 },
    { id: "celene", name: "SDC.Moon.Celene", period: 91, color: "#bfe6e3", epoch: { year: 576, day: 3 }, epochPhase: 0.5 }
  ],

  // Eberron's twelve moons, one for each month, each a week slower than the one before. Rising from the Last War names
  // each month for the moon whose orbit brings it closest to the world then, so each moon is full in the middle of its
  // own month in 998 YK, where D&D 5e's Calendar of Khorvaire begins. The book gives no periods, so the moons drift
  // from their months in later years, all but Zarantyr, which is full on the 15th of every month.
  khorvaire: [
    ["zarantyr", "#f4f4f6"], ["olarune", "#f2c99a"], ["therendor", "#d9d9d6"], ["eyre", "#e9eef2"],
    ["dravago", "#d9c6ec"], ["nymm", "#f6e7a1"], ["lharvion", "#e8e4dc"], ["barrakas", "#d7dade"],
    ["rhaan", "#b9d6f2"], ["sypheros", "#bdbab5"], ["aryth", "#f2a679"], ["vult", "#c9c6c0"]
  ].map(([id, color], index) => ({
    id, color,
    name: `SDC.Moon.${id.charAt(0).toUpperCase()}${id.slice(1)}`,
    period: 28 + (7 * index),
    epoch: { year: 998, day: (28 * index) + 14 },
    epochPhase: 0.5
  }))
};
