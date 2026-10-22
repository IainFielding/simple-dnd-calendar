import { MODULE_ID } from "./constants.mjs";
import * as sky from "./sky.mjs";

/**
 * Long days in summer and short ones in winter. While the GM has it turned on, the world calendar's own sunrise and
 * sunset move with the seasons, so everything that asks the calendar agrees: D&D 5e's dawn and dusk recovery and its
 * approximate times, the calendar's day wheel, and the scene's darkness.
 */

/**
 * Teach a calendar class seasonal sunrises and sunsets, which it uses while the setting is on.
 * @param {typeof foundry.data.CalendarData} CalendarClass  The world calendar's class.
 */
export function patchDaylight(CalendarClass) {
  const proto = CalendarClass?.prototype;
  if ( !proto ) return;
  const midsummers = new WeakMap();
  for ( const which of ["sunrise", "sunset"] ) {
    const base = proto[which];
    if ( typeof base !== "function" ) continue;
    Object.defineProperty(proto, which, {
      configurable: true,
      writable: true,
      value: function(time = game.time.components) {
        if ( !seasonalDaylight() ) return base.call(this, time);
        const components = typeof time === "number" ? this.timeToComponents(time) : time;
        if ( !midsummers.has(this) ) midsummers.set(this, sky.midsummer(this));
        return sky.daylight(this, components, midsummers.get(this))[which];
      }
    });
  }
}

/* -------------------------------------------- */

/**
 * Whether the GM has turned seasonal daylight on.
 * @returns {boolean}
 */
function seasonalDaylight() {
  try {
    return game.settings.get(MODULE_ID, "seasonalDaylight");
  } catch {
    return false;
  }
}
