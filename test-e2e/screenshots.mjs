/**
 * Take the screenshots in docs/screenshots from a real Foundry.
 *
 *   npm run docs:screenshots
 *
 * Uses the end-to-end harness's world and fixtures, with the canvas on so the calendar hangs over a scene.
 */

import fs from "node:fs";
import { GM_USER, PLAYER_USER, WORLD } from "./config.mjs";
import { setTime } from "./lib/harness.mjs";
import { startFoundry } from "./lib/server.mjs";
import { Session } from "./lib/session.mjs";
import { enableModules, ensureWorld, resetFixtures, resetWorld, useCalendar } from "./lib/world.mjs";

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
  for ( const session of [gm, player] ) {
    await session.eval(() => {
      ui.sidebar.collapse?.();
      document.body.style.background = "#3b3a36";
    });
  }

  const shoot = async (session, name, clip = CLIP) => {
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
  await gm.page.screenshot({ path: `${OUT}/advance.png`, clip: { ...CLIP, height: 260 } });
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
