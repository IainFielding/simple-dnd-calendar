/**
 * Take the screenshots in docs/screenshots from a real Foundry.
 *
 *   npm run docs:screenshots
 *
 * Uses the end-to-end harness's world and fixtures, with the canvas on so the calendar hangs over a scene. A scene
 * named "screenshot" in the test world, added by hand, is the backdrop: it is activated and viewed for the shots.
 * Without one, the fixtures' blank scene is used.
 */

import fs from "node:fs";
import { GM_USER, PLAYER_USER, WORLD } from "./config.mjs";
import { setTime } from "./lib/harness.mjs";
import { startFoundry } from "./lib/server.mjs";
import { Session } from "./lib/session.mjs";
import { enableModules, ensureWorld, resetFixtures, resetWorld, useCalendar } from "./lib/world.mjs";

// The calendar hangs over the scene, so the canvas is drawn (see lib/session.mjs).
process.env.SDC_CANVAS = "1";

const OUT = "docs/screenshots";
fs.mkdirSync(OUT, { recursive: true });

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

  // A full Selûne riding high on a winter's night, then the same day at noon and at dusk.
  await setTime(ctx, { year: 1501, day: 30, hour: 0, minute: 10 });
  await shoot(gm, "night");
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

  // The whole screen, for context.
  await gm.page.mouse.move(5, 900);
  await gm.page.screenshot({ path: `${OUT}/screen.png` });
  console.log(`  ${OUT}/screen.png`);
} finally {
  await player?.close();
  await gm?.close({ shutDownWorld: true });
  await server.stop();
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
