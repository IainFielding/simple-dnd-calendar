import { registerAnnouncements } from "./announce.mjs";
import { registerChatCommands } from "./chat.mjs";
import { MODULE_ID } from "./constants.mjs";
import { registerDarknessHooks, syncDarkness } from "./darkness.mjs";
import { patchDaylight } from "./daylight.mjs";
import { createCalendarHUD } from "./hud.mjs";
import { MOONS } from "./moons.mjs";
import * as sky from "./sky.mjs";

/* -------------------------------------------- */
/*  Initialization                              */
/* -------------------------------------------- */

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "animate", {
    name: "SDC.Settings.Animate.Name",
    hint: "SDC.Settings.Animate.Hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, "seasonTrim", {
    name: "SDC.Settings.SeasonTrim.Name",
    hint: "SDC.Settings.SeasonTrim.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    onChange: () => dnd5e.ui.calendar?.refresh?.()
  });

  game.settings.register(MODULE_ID, "sceneDarkness", {
    name: "SDC.Settings.SceneDarkness.Name",
    hint: "SDC.Settings.SceneDarkness.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    onChange: () => syncDarkness()
  });

  game.settings.register(MODULE_ID, "seasonalDaylight", {
    name: "SDC.Settings.SeasonalDaylight.Name",
    hint: "SDC.Settings.SeasonalDaylight.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
    onChange: () => {
      dnd5e.ui.calendar?.refresh?.();
      syncDarkness();
    }
  });

  game.settings.register(MODULE_ID, "announceDays", {
    name: "SDC.Settings.AnnounceDays.Name",
    hint: "SDC.Settings.AnnounceDays.Hint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register(MODULE_ID, "expanded", {
    scope: "client",
    config: false,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, "offeredToEnable", {
    scope: "world",
    config: false,
    type: Boolean,
    default: false
  });

  patchDaylight(CONFIG.time.worldCalendarClass);
  registerDarknessHooks();
  registerChatCommands();
  registerAnnouncements();

  const CalendarHUD = dnd5e.applications?.calendar?.CalendarHUD;
  if ( !CalendarHUD ) {
    console.error(`${MODULE_ID} | D&D 5e's calendar HUD was not found, so the calendar can't be shown.`);
    return;
  }
  CONFIG.DND5E.calendar.application = createCalendarHUD(CalendarHUD);

  game.modules.get(MODULE_ID).api = { moons: foundry.utils.deepClone(MOONS), sky };
});

/* -------------------------------------------- */

Hooks.once("setup", () => {
  /**
   * A hook event that fires once, before the calendar is first drawn, to let modules and world scripts change the
   * moons of D&D 5e's calendars or add moons for their own.
   * @function sogrom-simple-dnd-calendar.moons
   * @param {Record<string, import("./sky.mjs").MoonConfig[]>} moons  Moons keyed by calendar, as in
   *                                                                    `CONFIG.DND5E.calendar.calendars`.
   * @param {string} calendar  The world's calendar.
   */
  const api = game.modules.get(MODULE_ID).api;
  if ( api ) Hooks.callAll(`${MODULE_ID}.moons`, api.moons, game.settings.get("dnd5e", "calendar"));
});

/* -------------------------------------------- */

Hooks.once("ready", () => {
  offerToEnable();
});

/* -------------------------------------------- */

/**
 * D&D 5e only shows a calendar once its GM turns the calendar on. Offer to, once per world, the first time a GM
 * loads it with the module active.
 */
async function offerToEnable() {
  if ( !game.user.isActiveGM || game.settings.get(MODULE_ID, "offeredToEnable") ) return;
  const config = game.settings.get("dnd5e", "calendarConfig");
  if ( config?.enabled ) return;
  await game.settings.set(MODULE_ID, "offeredToEnable", true);
  const enable = await foundry.applications.api.DialogV2.confirm({
    window: { title: "SDC.Enable.Title", icon: "fa-solid fa-calendar-days" },
    content: `<p>${_loc("SDC.Enable.Content")}</p><p>${_loc("SDC.Enable.Recovery")}</p>`,
    yes: { label: "SDC.Enable.Yes", icon: "fa-solid fa-check" },
    no: { label: "SDC.Enable.No" },
    rejectClose: false
  });
  if ( enable ) await game.settings.set("dnd5e", "calendarConfig", { ...config.toObject(), enabled: true });
}
