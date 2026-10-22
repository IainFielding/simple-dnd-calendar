/**
 * The test world: its manifest on disk, its module configuration, and the documents every run starts from.
 *
 * A world is a directory holding `world.json`. Foundry builds its database on first launch and, finding no
 * GM, creates a passwordless "Gamemaster", which is the account the harness joins as.
 */

import fs from "node:fs";
import path from "node:path";
import { CORE_VERSION, DATA_DIR, MODULE_ID, PLAYER_USER, SYSTEM, SYSTEM_VERSION, WORLD } from "../config.mjs";

/** Write the world's manifest if it is missing. */
export function ensureWorld() {
  const dir = path.join(DATA_DIR, "worlds", WORLD.id);
  const manifest = path.join(dir, "world.json");
  fs.mkdirSync(dir, { recursive: true });
  if ( fs.existsSync(manifest) ) return;
  fs.writeFileSync(manifest, `${JSON.stringify({
    id: WORLD.id,
    title: WORLD.title,
    description: WORLD.description,
    system: SYSTEM,
    systemVersion: SYSTEM_VERSION,
    coreVersion: CORE_VERSION,
    compatibility: { minimum: String(Math.trunc(Number(CORE_VERSION))), verified: CORE_VERSION },
    playtime: 0,
    flags: {}
  }, null, 2)}\n`, "utf8");
}

/* -------------------------------------------- */

/**
 * Turn on exactly the world's modules, reloading if that changed anything, and check they came up.
 * @param {import("./session.mjs").Session} gm
 */
export async function enableModules(gm) {
  const changed = await gm.eval(async wanted => {
    const want = new Set(wanted);
    const current = game.settings.get("core", "moduleConfiguration") ?? {};
    const next = Object.fromEntries([...game.modules.keys()].map(id => [id, want.has(id)]));
    const changed = Object.keys(next).some(id => (current[id] ?? false) !== next[id]);
    if ( changed ) await game.settings.set("core", "moduleConfiguration", next);
    return changed;
  }, WORLD.modules);
  if ( changed ) await gm.reload();
  const inactive = await gm.eval(wanted => wanted.filter(id => !game.modules.get(id)?.active), WORLD.modules);
  if ( inactive.length ) throw new Error(`Modules did not activate: ${inactive.join(", ")}\n${gm.tail()}`);
}

/* -------------------------------------------- */

/**
 * Pick the world's calendar in D&D 5e's settings, as a GM would. D&D 5e only reads it as the world loads, so the GM
 * reloads if it changed; a player joined to the world must reload too.
 * @param {import("./session.mjs").Session} gm
 * @param {string} calendar  A calendar's value in `CONFIG.DND5E.calendar.calendars`, such as "harptos".
 * @returns {Promise<boolean>}  Whether it changed.
 */
export async function useCalendar(gm, calendar) {
  const changed = await gm.eval(async calendar => {
    if ( game.settings.get("dnd5e", "calendar") === calendar ) return false;
    await game.settings.set("dnd5e", "calendar", calendar);
    return true;
  }, calendar);
  if ( changed ) await gm.reload();
  return changed;
}

/* -------------------------------------------- */

/**
 * Clear out the last run and create what every test starts from: a Player user with a character, Aria, and a
 * scene, "The Yawning Portal", that both users are viewing. The calendar is turned on and shown to both users.
 *
 * Only documents the harness made, which carry its flag, are deleted: anything added to the world by hand, such as
 * the backdrop scene for the screenshots, is left alone.
 * @param {import("./session.mjs").Session} gm
 * @returns {Promise<{ player: string, aria: string }>}  The player's user ID and the character's UUID.
 */
export async function resetFixtures(gm) {
  return gm.eval(async ({ moduleId, playerName }) => {
    const flags = { [moduleId]: { fixture: true } };
    // Runs before the flag was added left their fixtures unflagged, so those are known by name.
    const names = new Set(["Aria", "The Yawning Portal"]);
    const ours = collection => collection.filter(d => d.getFlag(moduleId, "fixture") || names.has(d.name)).map(d => d.id);
    await Actor.deleteDocuments(ours(game.actors));
    const player = game.users.getName(playerName)
      ?? await User.create({ name: playerName, role: CONST.USER_ROLES.PLAYER });
    const owned = { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.NONE, [player.id]: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER };
    const aria = await Actor.create({ name: "Aria", type: "character", ownership: owned, flags });
    await player.update({ character: aria.id });

    await Scene.deleteDocuments(ours(game.scenes));
    await Scene.create({ name: "The Yawning Portal", active: true, width: 1000, height: 1000, flags });

    await game.settings.set(moduleId, "offeredToEnable", true);
    const config = game.settings.get("dnd5e", "calendarConfig");
    if ( !config.enabled ) await game.settings.set("dnd5e", "calendarConfig", { ...config.toObject(), enabled: true });
    return { player: player.id, aria: aria.uuid };
  }, { moduleId: MODULE_ID, playerName: PLAYER_USER });
}

/* -------------------------------------------- */

/**
 * Put each user's calendar back as the tests expect it: shown, open, not animating and with the season's trim off; and close
 * any windows a test left open.
 * @param {import("./session.mjs").Session} gm
 * @param {import("./session.mjs").Session} player
 */
export async function resetWorld(gm, player) {
  await gm.eval(async moduleId => {
    for ( const key of ["sceneDarkness", "seasonalDaylight", "announceDays"] ) {
      if ( game.settings.get(moduleId, key) ) await game.settings.set(moduleId, key, false);
    }
    if ( game.settings.get(moduleId, "seasonTrim") !== "none" ) await game.settings.set(moduleId, "seasonTrim", "none");
  }, MODULE_ID);
  for ( const session of [gm, player] ) {
    await session.eval(async moduleId => {
      const want = { animate: false, expanded: true, theme: "gilded" };
      for ( const [key, value] of Object.entries(want) ) {
        if ( game.settings.get(moduleId, key) !== value ) await game.settings.set(moduleId, key, value);
      }
      const prefs = game.settings.get("dnd5e", "calendarPreferences");
      if ( !prefs.visible || (prefs.formatters.date !== "monthDay") || (prefs.formatters.time !== "hoursMinutes") ) {
        await game.settings.set("dnd5e", "calendarPreferences", {
          visible: true, formatters: { date: "monthDay", time: "hoursMinutes" }
        });
      }
      const app = dnd5e.ui.calendar;
      if ( app && !app.rendered ) await app.render({ force: true });
      app?.element?.classList.add("expanded");
      for ( const instance of foundry.applications.instances.values() ) {
        if ( instance.rendered && instance.hasFrame && (instance.id !== "sidebar") ) await instance.close();
      }
      ui.notifications.clear?.();
    }, MODULE_ID);
  }
  await gm.page.waitForTimeout(200);
}
