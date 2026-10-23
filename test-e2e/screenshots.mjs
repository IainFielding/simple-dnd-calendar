/**
 * Take the screenshots in docs/screenshots from a real Foundry.
 *
 *   npm run docs:screenshots
 *
 * Uses the end-to-end harness's world and fixtures, with the canvas on so the calendar hangs over a scene. A scene
 * named "screenshot" in the test world, added by hand, is the backdrop: it is activated and viewed for the shots.
 * Without one, the fixtures' blank scene is used.
 *
 * Each sky and bar trim is shot too, into docs/screenshots/trims. To take only those:
 *
 *   npm run docs:screenshots -- --trims
 */

import fs from "node:fs";
import { GM_USER, MODULE_ID, PLAYER_USER, WORLD } from "./config.mjs";
import { setTime } from "./lib/harness.mjs";
import { startFoundry } from "./lib/server.mjs";
import { Session } from "./lib/session.mjs";
import { enableModules, ensureWorld, resetFixtures, resetWorld, useCalendar } from "./lib/world.mjs";

// The calendar hangs over the scene, so the canvas is drawn (see lib/session.mjs).
process.env.SDC_CANVAS = "1";

const OUT = "docs/screenshots";
fs.mkdirSync(OUT, { recursive: true });

/** Take only the trims' shots. */
const TRIMS_ONLY = process.argv.includes("--trims");

/** The calendar and a margin around it, for a cropped shot. */
const CLIP = { x: 480, y: 0, width: 640, height: 230 };

ensureWorld();
const server = await startFoundry(WORLD.id);
let gm;
let player;
try {
  gm = await Session.open(GM_USER, { scale: 2 });
  await enableModules(gm);
  await useCalendar(gm, "harptos");
  await resetFixtures(gm);
  player = await Session.open(PLAYER_USER, { scale: 2 });
  const ctx = { gm, player };
  await resetWorld(gm, player);

  // The backdrop: the hand-made "screenshot" scene, shown to everyone, with the game unpaused so no banner covers it.
  const backdrop = await gm.eval(async () => {
    const scene = game.scenes.find(s => s.name.trim().toLowerCase() === "screenshot");
    if ( scene && !scene.active ) await scene.activate();
    if ( game.paused ) game.togglePause(false, { broadcast: true });
    return scene?.name ?? null;
  });
  console.log(backdrop ? `Backdrop: the "${backdrop}" scene.` : "No \"screenshot\" scene, so the backdrop is blank.");
  for ( const session of [gm, player] ) {
    await waitForCanvas(session, backdrop);
    await session.eval(() => ui.sidebar.collapse?.());
  }

  const shoot = async (session, name, clip = CLIP) => {
    await waitForCanvas(session, backdrop);
    await session.page.mouse.move(5, 900);
    await session.page.waitForTimeout(300);
    await session.page.screenshot({ path: `${OUT}/${name}.png`, clip });
    console.log(`  ${OUT}/${name}.png`);
  };

  if ( !TRIMS_ONLY ) await docShots(ctx, shoot);
  await trimShots(ctx, shoot);

  // The whole screen, for context.
  if ( !TRIMS_ONLY ) {
    await gm.page.mouse.move(5, 900);
    await gm.page.screenshot({ path: `${OUT}/screen.png` });
    console.log(`  ${OUT}/screen.png`);
  }
} finally {
  await player?.close();
  await gm?.close({ shutDownWorld: true });
  await server.stop();
}

/* -------------------------------------------- */

/**
 * The shots in the README: the calendar through the day, the GM's controls, collapsed, each style, and a short
 * winter day.
 * @param {{gm: Session, player: Session}} ctx
 * @param {(session: Session, name: string, clip?: object) => Promise<void>} shoot
 */
async function docShots(ctx, shoot) {
  const { gm } = ctx;

  // The season's trim is off by default; it is on in these first shots, to show it.
  await gm.eval(moduleId => game.settings.set(moduleId, "seasonTrim", "follow"), MODULE_ID);

  // A full Selûne riding high on a winter's night, then the same day at noon and at dusk.
  await setTime(ctx, { year: 1501, day: 30, hour: 0, minute: 10 });
  await shoot(gm, "night");

  // The same night, taller, for the module's artwork on Foundry's setup screen (see "media" in module.json).
  fs.mkdirSync("assets", { recursive: true });
  await gm.page.screenshot({ path: "assets/cover.jpg", type: "jpeg", quality: 88, clip: { ...CLIP, height: 416 } });
  console.log("  assets/cover.jpg");

  await setTime(ctx, { year: 1525, day: 120, hour: 12, minute: 0 });
  await shoot(gm, "day");
  await setTime(ctx, { year: 1525, day: 250, hour: 18, minute: 30 });
  await shoot(gm, "dusk");

  // The GM's advance drop-down.
  await setTime(ctx, { year: 1525, day: 120, hour: 9, minute: 15 });
  await gm.page.locator("#sdc-calendar [data-control=advance] > button").hover();
  await gm.page.waitForTimeout(300);
  // The button's tooltip sits off its right side, past the usual crop: widen the shot to take it in.
  const tip = await gm.page.locator("#tooltip").boundingBox();
  const right = Math.max(CLIP.x + CLIP.width, Math.ceil((tip?.x ?? 0) + (tip?.width ?? 0)) + 16);
  await gm.page.screenshot({ path: `${OUT}/advance.png`, clip: { ...CLIP, width: right - CLIP.x, height: 260 } });
  console.log(`  ${OUT}/advance.png`);

  // Collapsed to the bar alone.
  await gm.page.locator("#sdc-calendar button[data-action=toggleCalendar]").click();
  await gm.page.waitForTimeout(400);
  await shoot(gm, "collapsed", { ...CLIP, height: 70 });
  await gm.page.locator("#sdc-calendar button[data-action=toggleCalendar]").click();

  // The season's trim is off by default, and off for the rest of the shots, which show the calendar as it is set up.
  await gm.eval(moduleId => game.settings.set(moduleId, "seasonTrim", "none"), MODULE_ID);

  // Each style, at the same midnight as the first shot, to set side by side.
  await setTime(ctx, { year: 1501, day: 30, hour: 0, minute: 10 });
  for ( const theme of ["gilded", "parchment", "stone"] ) {
    await gm.eval(({ moduleId, theme }) => game.settings.set(moduleId, "theme", theme), { moduleId: MODULE_ID, theme });
    await shoot(gm, `style-${theme}`);
  }
  await gm.eval(moduleId => game.settings.set(moduleId, "theme", "gilded"), MODULE_ID);

  // A short winter day, a few days after the solstice, with Long Summer Days on.
  await gm.eval(moduleId => game.settings.set(moduleId, "seasonalDaylight", true), MODULE_ID);
  await setTime(ctx, { year: 1525, day: 358, hour: 12, minute: 0 });
  await shoot(gm, "winter-day");
  await gm.eval(moduleId => game.settings.set(moduleId, "seasonalDaylight", false), MODULE_ID);
}

/* -------------------------------------------- */

/**
 * A shot of each trim: the sky's for each season and each festival of the Calendar of Harptos, and the bar's for
 * each adventure, with the bar collapsed too so its whole length shows.
 * @param {{gm: Session, player: Session}} ctx
 * @param {(session: Session, name: string, clip?: object) => Promise<void>} shoot
 */
async function trimShots(ctx, shoot) {
  const { gm } = ctx;
  const set = (key, value) => gm.eval(({ moduleId, key, value }) => game.settings.set(moduleId, key, value),
    { moduleId: MODULE_ID, key, value });
  fs.mkdirSync(`${OUT}/trims`, { recursive: true });

  // The seasons, mid-season, and each festival on its day, at dusk.
  await set("barTrim", "none");
  await set("seasonTrim", "follow");
  const seasons = { winter: [1525, 15], spring: [1525, 100], summer: [1525, 180], fall: [1525, 300] };
  for ( const [kind, [year, day]] of Object.entries(seasons) ) {
    await setTime(ctx, { year, day, hour: 19, minute: 0 });
    await expectSkyTrim(gm, kind);
    await shoot(gm, `trims/sky-${kind}`);
  }
  const festivals = { midwinter: "Midwinter", greengrass: "Greengrass", midsummer: "Midsummer",
    shieldmeet: "Shieldmeet", harvest: "Highharvestide", moonfeast: "FeastOfTheMoon" };
  for ( const [kind, festival] of Object.entries(festivals) ) {
    const { year, day } = await festivalDay(gm, 1524, festival);
    await setTime(ctx, { year, day, hour: 19, minute: 0 });
    await expectSkyTrim(gm, kind);
    await shoot(gm, `trims/festival-${kind}`);
  }

  // Each adventure on the bar, with the sky bare, open and then collapsed.
  await set("seasonTrim", "none");
  await setTime(ctx, { year: 1525, day: 100, hour: 21, minute: 0 });
  const adventures = await gm.eval(moduleId => Object.keys(game.settings.settings.get(`${moduleId}.barTrim`)?.choices ?? {})
    .filter(k => k !== "none"), MODULE_ID);
  for ( const kind of adventures ) {
    await set("barTrim", kind);
    await gm.page.waitForFunction(kind => document.getElementById("sdc-calendar")?.dataset.barTrim === kind, kind);
    await shoot(gm, `trims/bar-${kind}`);
    await gm.page.locator("#sdc-calendar button[data-action=toggleCalendar]").click();
    await gm.page.waitForTimeout(400);
    await shoot(gm, `trims/bar-${kind}-collapsed`, { ...CLIP, height: 80 });
    await gm.page.locator("#sdc-calendar button[data-action=toggleCalendar]").click();
    await gm.page.waitForTimeout(400);
  }
  await set("barTrim", "none");
}

/**
 * The first day a festival of the Calendar of Harptos falls on, from a year onwards. Shieldmeet falls only in leap
 * years.
 * @param {Session} gm
 * @param {number} from      The year to look from.
 * @param {string} festival  The last part of its name's localization key, such as "Midwinter".
 * @returns {Promise<{year: number, day: number}>}
 */
async function festivalDay(gm, from, festival) {
  const found = await gm.eval(({ from, festival }) => {
    const calendar = game.time.calendar;
    for ( let year = from; year < from + 8; year++ ) {
      const y = year - calendar.years.yearZero;
      for ( let day = 0; day < 400; day++ ) {
        const components = calendar.timeToComponents(calendar.componentsToTime({ year: y, day, hour: 12, minute: 0 }));
        if ( components.year !== y ) break;
        if ( calendar.findFestivalDay?.(components)?.name.endsWith(`.${festival}`) ) return { year, day };
      }
    }
    return null;
  }, { from, festival });
  if ( !found ) throw new Error(`${festival} doesn't fall within eight years of ${from}.`);
  return found;
}

/**
 * Check the calendar shows the sky's trim expected, so a shot isn't taken of the wrong one.
 * @param {Session} gm
 * @param {string} kind
 */
async function expectSkyTrim(gm, kind) {
  await gm.page.waitForFunction(kind => document.getElementById("sdc-calendar")?.dataset.skyTrim === kind, kind,
    { timeout: 10_000 });
}

/**
 * Wait until a user's canvas has drawn the backdrop scene, or whichever scene is active when there is none, and its
 * textures have loaded.
 * @param {Session} session
 * @param {string|null} backdrop
 */
async function waitForCanvas(session, backdrop) {
  await session.page.waitForFunction(name => canvas?.ready && !canvas.loading
    && (!name || (canvas.scene?.name === name)), backdrop, { timeout: 60_000, polling: 250 });
  await session.page.waitForTimeout(500);
}
