/**
 * Just enough of Foundry for the module's scripts to be imported and run under Node.
 *
 * The sky maths is pure and needs nothing from Foundry. This file is where stand-ins go when a test imports a script
 * that reaches for Foundry's globals as it loads. Vitest loads it before any test imports the scripts.
 */

globalThis.Hooks ??= { on() {}, once() {}, call() { return true; }, callAll() {} };

/**
 * A calendar with the same shape and arithmetic as Foundry's CalendarData, without leap years: a year of `months`,
 * 24-hour days, and seasons as given.
 * @param {object} options
 * @param {{name?: string, ordinal: number, days: number}[]} options.months
 * @param {object[]} [options.seasons]
 * @param {number} [options.yearZero=0]
 * @returns {object}
 */
export function makeCalendar({ months, seasons = [], yearZero = 0 }) {
  const daysPerYear = months.reduce((n, m) => n + m.days, 0);
  const days = { daysPerYear, daysPerLeapYear: daysPerYear, hoursPerDay: 24, minutesPerHour: 60, secondsPerMinute: 60 };
  return {
    years: { yearZero },
    months: { values: months },
    seasons: { values: seasons },
    days,
    componentsToTime({ year = 0, day = 0, hour = 0, minute = 0, second = 0 }) {
      return (((((year * daysPerYear) + day) * 24) + hour) * 3600) + (minute * 60) + second;
    }
  };
}
