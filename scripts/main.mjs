import { registerAnnouncements } from "./announce.mjs";
import { addCalendars, registerCalendarsSetting } from "./calendars.mjs";
import { CalendarsMenu } from "./calendars-menu.mjs";
import { registerChatCommands } from "./chat.mjs";
import { MODULE_ID } from "./constants.mjs";
import { darknessNow, registerDarknessHooks, syncDarkness } from "./darkness.mjs";
import { patchDaylight } from "./daylight.mjs";
import { createCalendarHUD } from "./hud.mjs";
import { MOONS } from "./moons.mjs";
import * as sky from "./sky.mjs";
import { SUNS } from "./suns.mjs";
import { BAR_TRIM_CHOICES, SKY_TRIM_CHOICES } from "./trim.mjs";

/* -------------------------------------------- */
/*  Initialization                              */
/* -------------------------------------------- */

// D&D 5e picks the world's calendar during its own init, before the module's, so the additional calendars join its
// list from the hook it calls just before.
Hooks.once("dnd5e.setupCalendar", addCalendars);

Hooks.once("init", () => {
  registerCalendarsSetting();
  game.settings.registerMenu(MODULE_ID, "calendarsMenu", {
    name: "SDC.Settings.Calendars.Name",
    label: "SDC.Settings.Calendars.Label",
    hint: "SDC.Settings.Calendars.Hint",
    icon: "fa-solid fa-calendar-plus",
    type: CalendarsMenu,
    restricted: true
  });

  game.settings.register(MODULE_ID, "animate", {
    name: "SDC.Settings.Animate.Name",
    hint: "SDC.Settings.Animate.Hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, "theme", {
    name: "SDC.Settings.Theme.Name",
    hint: "SDC.Settings.Theme.Hint",
    scope: "client",
    config: true,
    type: String,
    choices: {
      gilded: "SDC.Settings.Theme.Gilded",
      parchment: "SDC.Settings.Theme.Parchment",
      stone: "SDC.Settings.Theme.Stone"
    },
    default: "gilded",
    onChange: theme => {
      const element = dnd5e.ui.calendar?.element;
      if ( element ) element.dataset.theme = theme;
    }
  });

  game.settings.register(MODULE_ID, "seasonTrim", {
    name: "SDC.Settings.SeasonTrim.Name",
    hint: "SDC.Settings.SeasonTrim.Hint",
    scope: "world",
    config: true,
    type: String,
    choices: Object.fromEntries(SKY_TRIM_CHOICES.map(choice => [choice, `SDC.Settings.SeasonTrim.${choice.capitalize()}`])),
    default: "none",
    onChange: () => dnd5e.ui.calendar?.refresh?.()
  });

  game.settings.register(MODULE_ID, "barTrim", {
    name: "SDC.Settings.BarTrim.Name",
    hint: "SDC.Settings.BarTrim.Hint",
    scope: "world",
    config: true,
    type: String,
    choices: Object.fromEntries(BAR_TRIM_CHOICES.map(choice => [choice, `SDC.Settings.BarTrim.${choice.capitalize()}`])),
    default: "none",
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

  game.modules.get(MODULE_ID).api = { moons: foundry.utils.deepClone(MOONS), suns: foundry.utils.deepClone(SUNS), sky,
    darknessNow };
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
  if ( !api ) return;
  const calendar = game.settings.get("dnd5e", "calendar");
  Hooks.callAll(`${MODULE_ID}.moons`, api.moons, calendar);

  /**
   * A hook event that fires once, before the calendar is first drawn, to let modules and world scripts change the
   * suns of D&D 5e's calendars or add suns for their own. A calendar with no suns listed has the usual one.
   * @function sogrom-simple-dnd-calendar.suns
   * @param {Record<string, import("./sky.mjs").SunConfig[]>} suns  Suns keyed by calendar, as in
   *                                                                  `CONFIG.DND5E.calendar.calendars`.
   * @param {string} calendar  The world's calendar.
   */
  Hooks.callAll(`${MODULE_ID}.suns`, api.suns, calendar);
});

/* -------------------------------------------- */

Hooks.once("ready", () => {
  migrateSeasonTrim();
  offerToEnable();
});

/* -------------------------------------------- */

/**
 * Dressing the sky for the season was once on or off. Carry a world's old choice over: on follows the seasons.
 */
async function migrateSeasonTrim() {
  if ( !game.user.isActiveGM ) return;
  const choice = game.settings.get(MODULE_ID, "seasonTrim");
  if ( SKY_TRIM_CHOICES.includes(choice) ) return;
  const on = (choice === true) || (choice === "true");
  await game.settings.set(MODULE_ID, "seasonTrim", on ? "follow" : "none");
}

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
