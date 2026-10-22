/**
 * End-to-end tests: the calendar in a real world, as the GM and as a player see it.
 */

import { MODULE_ID } from "./config.mjs";
import { assert, assertEqual, readCalendar, setClientSettings, setTime, test, waitFor, waitForShown } from "./lib/harness.mjs";
import { useCalendar } from "./lib/world.mjs";

/* -------------------------------------------- */
/*  Setup                                       */
/* -------------------------------------------- */

test("the calendar is the one the GM picked in D&D 5e's settings", async ({ gm, player }) => {
  try {
    for ( const [key, name, moon] of [["gregorian", "Simplified Gregorian", "moon"], ["harptos", "Calendar of Harptos", "selune"]] ) {
      await useCalendar(gm, key);
      await player.reload();
      for ( const session of [gm, player] ) {
        const shown = await session.eval(moduleId => ({
          name: game.time.calendar.name,
          moons: game.modules.get(moduleId).api.moons[game.settings.get("dnd5e", "calendar")].map(m => m.id)
        }), MODULE_ID);
        assertEqual(shown, { name, moons: [moon] }, `${session.user}'s calendar with ${key} picked`);
      }
    }
  } finally {
    if ( await useCalendar(gm, "harptos") ) await player.reload();
  }
});

test("the GM is offered to turn the calendar on, once", async ({ gm }) => {
  await gm.eval(async moduleId => {
    const config = game.settings.get("dnd5e", "calendarConfig");
    await game.settings.set("dnd5e", "calendarConfig", { ...config.toObject(), enabled: false });
    await game.settings.storage.get("world").getSetting(`${moduleId}.offeredToEnable`)?.delete();
  }, MODULE_ID);
  await gm.reload();
  const dialog = gm.page.locator(".application.dialog", { hasText: "Turn On the Calendar?" });
  await dialog.waitFor({ timeout: 10_000 });
  await dialog.locator("button[data-action=yes]").click();
  await waitFor(gm, () => game.settings.get("dnd5e", "calendarConfig").enabled, null, "the calendar to be turned on");
  await waitFor(gm, () => !!document.getElementById("sdc-calendar"), null, "the calendar to appear");

  // Loading the world again doesn't ask again.
  await gm.reload();
  await gm.page.waitForTimeout(1500);
  assertEqual(await gm.page.locator(".application.dialog", { hasText: "Turn On the Calendar?" }).count(), 0, "dialogs");
});

/* -------------------------------------------- */
/*  Display                                     */
/* -------------------------------------------- */

test("the calendar replaces D&D 5e's and hangs from the top of the screen", async ({ gm, player }) => {
  for ( const session of [gm, player] ) {
    const shown = await session.eval(() => ({
      ours: !!document.getElementById("sdc-calendar"),
      theirs: !!document.getElementById("calendar-hud"),
      app: dnd5e.ui.calendar?.id
    }));
    assertEqual(shown, { ours: true, theirs: false, app: "sdc-calendar" }, `${session.user}'s calendar`);
    const calendar = await readCalendar(session);
    assert(calendar.inUiTop, `${session.user}'s calendar is not in #ui-top`);
    const box = await session.page.locator("#sdc-calendar").boundingBox();
    assert(Math.abs((box.x + (box.width / 2)) - 800) < 220, `the calendar is not near the middle: ${JSON.stringify(box)}`);
    assert(box.y < 5, `the calendar does not hang from the top: ${JSON.stringify(box)}`);
  }
});

test("the bar shows the day of the week and the time, and the band shows the date", async ctx => {
  await setTime(ctx, { year: 1525, day: 79, hour: 14, minute: 30 });
  const expected = await ctx.gm.eval(() => {
    const calendar = game.time.calendar;
    const components = game.time.components;
    return {
      day: _loc(calendar.days.values[components.dayOfWeek].name),
      date: calendar.format(components, "formatMonthDay")
    };
  });
  for ( const session of [ctx.gm, ctx.player] ) {
    const calendar = await readCalendar(session);
    assert(calendar.time.endsWith("14:30"), `${session.user}'s time: ${calendar.time}`);
    assert(calendar.time.toLowerCase().startsWith(expected.day.toLowerCase()), `${session.user}'s day: ${calendar.time}`);
    assertEqual(calendar.date.toLowerCase(), expected.date.toLowerCase(), `${session.user}'s date`);
  }
});

test("the date and time follow D&D 5e's calendar preferences", async ctx => {
  await ctx.player.eval(() => game.settings.set("dnd5e", "calendarPreferences", {
    visible: true, formatters: { date: "monthDayYear", time: "approximateTime" }
  }));
  await setTime(ctx, { year: 1525, day: 79, hour: 12 });
  const calendar = await waitFor(ctx.player, () => {
    const time = document.querySelector("#sdc-calendar .sdc-time")?.innerText ?? "";
    return time.endsWith("Noon") ? time : null;
  }, null, "the approximate time");
  assert(calendar.endsWith("Noon"), `player's time: ${calendar}`);
  const date = (await readCalendar(ctx.player)).date;
  assert(date.includes("1525"), `player's date has no year: ${date}`);
});

test("the day wheel turns through the day", async ctx => {
  const rotations = {};
  for ( const hour of [0, 6, 12, 18] ) {
    await setTime(ctx, { year: 1525, day: 100, hour });
    rotations[hour] = (await readCalendar(ctx.gm)).wheel;
  }
  assertEqual(rotations, { 0: "rotate(-180.00)", 6: "rotate(-90.00)", 12: "rotate(0.00)", 18: "rotate(90.00)" }, "wheel");
});

test("the icon on the wheel shows the part of the day", async ctx => {
  const phases = {};
  for ( const [hour, minute] of [[2, 0], [5, 30], [12, 0], [18, 30]] ) {
    await setTime(ctx, { year: 1525, day: 100, hour, minute });
    phases[`${hour}:${minute}`] = (await readCalendar(ctx.player)).phase;
  }
  assertEqual(phases, { "2:0": "night", "5:30": "dawn", "12:0": "day", "18:30": "dusk" }, "phases");
});

test("the season dresses the frame and festivals show beside the bowl", async ctx => {
  await ctx.gm.eval(moduleId => game.settings.set(moduleId, "seasonTrim", true), MODULE_ID);
  await setTime(ctx, { year: 1525, day: 100, hour: 12 });
  let calendar = await readCalendar(ctx.gm);
  assertEqual([calendar.season, calendar.seasonKind, calendar.festival], ["Spring", "spring", null], "in Tarsakh");
  await setTime(ctx, { year: 1525, day: 30, hour: 12 });
  calendar = await readCalendar(ctx.gm);
  assertEqual([calendar.season, calendar.seasonKind, calendar.festival], ["Winter", "winter", "Midwinter"],
    "on Midwinter");
});

test("the season's trim is off until the GM turns it on, for everyone", async ctx => {
  const { gm, player } = ctx;
  await setTime(ctx, { year: 1525, day: 30, hour: 12 });
  const trim = session => session.eval(() => {
    const root = document.getElementById("sdc-calendar");
    return { kind: root.dataset.season || null, pieces: root.querySelectorAll(".sdc-trim-bar > *, .sdc-trim-bowl > *").length > 0 };
  });
  for ( const session of [gm, player] ) assertEqual(await trim(session), { kind: null, pieces: false }, "by default");
  await gm.eval(moduleId => game.settings.set(moduleId, "seasonTrim", true), MODULE_ID);
  for ( const session of [gm, player] ) {
    await waitFor(session, () => document.getElementById("sdc-calendar")?.dataset.season === "winter", undefined,
      "the trim to come");
    assertEqual(await trim(session), { kind: "winter", pieces: true }, "with the trim on");
  }
  await gm.eval(moduleId => game.settings.set(moduleId, "seasonTrim", false), MODULE_ID);
  for ( const session of [gm, player] ) {
    await waitFor(session, () => !document.getElementById("sdc-calendar")?.dataset.season, undefined, "the trim to go");
    assertEqual(await trim(session), { kind: null, pieces: false }, "with the trim off again");
  }
});

test("the season band slides through the year", async ctx => {
  const positions = [];
  for ( const day of [0, 90, 180] ) {
    await setTime(ctx, { year: 1525, day, hour: 0 });
    positions.push(await ctx.gm.eval(() => document.querySelector("#sdc-calendar .sdc-season").style.backgroundPositionX));
  }
  const px = positions.map(p => parseFloat(p));
  assert(px[0] > px[1] && px[1] > px[2], `the band does not move left as the year passes: ${positions}`);
  assert(Math.abs((px[0] - px[1]) - (90 / 365 * 1380)) < 2, `the band moves the wrong distance: ${positions}`);
});

test("Selûne rides the bowl when she is up, with her phase", async ctx => {
  // Selûne is full a little before 16:30 on the 30th of Hammer 1501 DR, so she is high at the following midnight.
  await setTime(ctx, { year: 1501, day: 30, hour: 0 });
  let calendar = await readCalendar(ctx.player);
  assertEqual(calendar.moons, ["Selûne: Full Moon"], "moons at midnight");
  const place = await ctx.player.eval(() => {
    const moon = document.querySelector("#sdc-calendar .sdc-moon:not([hidden])").getBoundingClientRect();
    const bowl = document.querySelector("#sdc-calendar .sdc-sky").getBoundingClientRect();
    return { dx: (moon.x + (moon.width / 2)) - (bowl.x + (bowl.width / 2)), y: moon.y - bowl.y };
  });
  assert(Math.abs(place.dx) < 30 && place.y > 50, `a midnight full moon is not near the bottom of the bowl: ${JSON.stringify(place)}`);

  // At noon a full moon is below the horizon.
  await setTime(ctx, { year: 1501, day: 30, hour: 12 });
  calendar = await readCalendar(ctx.player);
  assertEqual(calendar.moons, [], "moons at noon");
});

test("summer days are long and winter days short, once the GM turns it on", async ctx => {
  const { gm, player } = ctx;
  const read = session => session.eval(() => {
    const calendar = game.time.calendar;
    const root = document.getElementById("sdc-calendar");
    return {
      sunrise: calendar.sunrise(game.time.components),
      phase: root.querySelector(".sdc-phase").dataset.phase,
      face: root.querySelector(".sdc-wheel-day").getAttribute("d")
    };
  });

  // Kythorn 20, the summer solstice, at five in the morning.
  await setTime(ctx, { year: 1525, day: 170, hour: 5 });
  const even = await read(player);
  assertEqual([even.sunrise, even.phase], [6, "dawn"], "sunrise and phase before it is turned on");

  await gm.eval(moduleId => game.settings.set(moduleId, "seasonalDaylight", true), MODULE_ID);
  for ( const session of [gm, player] ) {
    await waitFor(session, () => document.querySelector("#sdc-calendar .sdc-phase").dataset.phase === "day", null,
      "five in the morning to be daytime at midsummer");
  }
  const summer = await read(player);
  assert(Math.abs(summer.sunrise - 4) < 0.05, `midsummer sunrise: ${summer.sunrise}`);
  assert(summer.face !== even.face, "the day face did not grow");
  assert(summer.face.includes(" 1 1 "), `the day face is not more than half the wheel: ${summer.face}`);

  // At midwinter, seven in the morning is still before dawn.
  await setTime(ctx, { year: 1525, day: 350, hour: 7, minute: 30 });
  const winter = await read(player);
  assert(Math.abs(winter.sunrise - 8) < 0.05, `midwinter sunrise: ${winter.sunrise}`);
  assertEqual(winter.phase, "dawn", "half past seven at midwinter");
});

test("the active scene darkens at night, once the GM turns it on", async ctx => {
  const { gm } = ctx;
  const darkness = () => gm.eval(() => game.scenes.active.environment.darknessLevel);
  await gm.eval(() => game.scenes.active.update({ "environment.darknessLevel": 0, "environment.darknessLock": false }));
  await setTime(ctx, { year: 1525, day: 100, hour: 23 });
  assertEqual(await darkness(), 0, "darkness before it is turned on");

  await gm.eval(moduleId => game.settings.set(moduleId, "sceneDarkness", true), MODULE_ID);
  await waitFor(gm, () => game.scenes.active.environment.darknessLevel === 1, null, "the scene to darken at night");
  await setTime(ctx, { year: 1525, day: 101, hour: 12 });
  await waitFor(gm, () => game.scenes.active.environment.darknessLevel === 0, null, "the scene to lighten at noon");
  await setTime(ctx, { year: 1525, day: 101, hour: 18, minute: 30 });
  await waitFor(gm, () => game.scenes.active.environment.darknessLevel === 0.5, null, "half dark half way through dusk");

  // A scene with its darkness locked is left as it is.
  await gm.eval(() => game.scenes.active.update({ "environment.darknessLock": true }));
  await setTime(ctx, { year: 1525, day: 101, hour: 23 });
  await gm.page.waitForTimeout(300);
  assertEqual(await darkness(), 0.5, "a locked scene's darkness");
  await gm.eval(() => game.scenes.active.update({ "environment.darknessLock": false }));
});

/* -------------------------------------------- */
/*  Controls                                    */
/* -------------------------------------------- */

test("the GM has the time controls and players don't", async ({ gm, player }) => {
  const gmControls = (await readCalendar(gm)).controls;
  for ( const action of ["reverse", "setDate", "advance", "toggleCalendar"] ) {
    assert(gmControls.includes(action), `the GM has no ${action} button: ${gmControls}`);
  }
  const playerControls = (await readCalendar(player)).controls;
  for ( const action of ["reverse", "setDate", "advance"] ) {
    assert(!playerControls.includes(action), `the player has a ${action} button: ${playerControls}`);
  }
  assert(playerControls.includes("openCharacterSheet"), `the player has no character sheet button: ${playerControls}`);
  assert(playerControls.includes("toggleCalendar"), `the player has no toggle: ${playerControls}`);
});

test("rewind and advance sit at the outer ends of the bar", async ({ gm }) => {
  const order = await gm.eval(() => {
    const centre = el => { const b = el.getBoundingClientRect(); return b.x + (b.width / 2); };
    const buttons = [...document.querySelectorAll("#sdc-calendar .sdc-controls > .calendar-button > button")];
    return buttons.sort((a, b) => centre(a) - centre(b)).map(b => b.dataset.action);
  });
  assertEqual(order[0], "reverse", "leftmost button");
  assertEqual(order.at(-1), "advance", "rightmost button");
});

test("the advance and rewind buttons and their drop-downs change the time", async ctx => {
  const start = await setTime(ctx, { year: 1525, day: 100, hour: 8 });
  const { gm } = ctx;
  await gm.page.locator("#sdc-calendar [data-control=advance] > button").click();
  await waitFor(gm, t => game.time.worldTime === t, start + 3600, "an hour to pass");

  await gm.page.locator("#sdc-calendar [data-control=advance] > button").hover();
  const plusDay = gm.page.locator("#sdc-calendar [data-control=advance] .sdc-dropdown button[data-unit=day][data-value='1']");
  await plusDay.waitFor({ state: "visible", timeout: 5000 });
  await plusDay.click();
  await waitFor(gm, t => game.time.worldTime === t, start + 3600 + 86400, "a day to pass");

  await gm.page.locator("#sdc-calendar [data-control=reverse] > button").hover();
  const minus8 = gm.page.locator("#sdc-calendar [data-control=reverse] .sdc-dropdown button[data-unit=hour][data-value='8']");
  await minus8.waitFor({ state: "visible", timeout: 5000 });
  await minus8.click();
  const end = start + 3600 + 86400 - (8 * 3600);
  await waitFor(gm, t => game.time.worldTime === t, end, "eight hours to rewind");
  await waitForShown(ctx.player, end);
});

test("the Set Date button opens D&D 5e's Set Date dialog", async ({ gm }) => {
  await gm.page.locator("#sdc-calendar button[data-action=setDate]").click();
  await waitFor(gm, () => [...foundry.applications.instances.values()]
    .some(a => a.rendered && (a.constructor.name === "SetDateDialog")), null, "the Set Date dialog");
});

test("buttons other modules add with D&D 5e's hook appear and work", async ({ gm }) => {
  try {
    await gm.eval(async () => {
      globalThis.__sdcHook = Hooks.on("dnd5e.prepareCalendarButtons", (app, buttons) => buttons.push({
        action: "sdcTest", icon: "fa-solid fa-dragon", position: "start", tooltip: "Test",
        onClick: () => { globalThis.__sdcClicked = true; }
      }));
      await dnd5e.ui.calendar.render();
    });
    await gm.page.locator("#sdc-calendar button[data-action=sdcTest]").click();
    await waitFor(gm, () => globalThis.__sdcClicked === true, null, "the added button's click handler");
  } finally {
    await gm.eval(async () => {
      Hooks.off("dnd5e.prepareCalendarButtons", globalThis.__sdcHook);
      await dnd5e.ui.calendar.render();
    });
  }
});

test("the toggle hides and shows the sky, and is remembered", async ({ player }) => {
  const toggle = player.page.locator("#sdc-calendar button[data-action=toggleCalendar]");
  await toggle.click();
  await player.page.waitForTimeout(400);
  let calendar = await readCalendar(player);
  assertEqual([calendar.expanded, calendar.visualHeight], [false, 0], "collapsed");
  assertEqual(await player.eval(id => game.settings.get(id, "expanded"), MODULE_ID), false, "the remembered state");

  await player.reload();
  calendar = await readCalendar(player);
  assertEqual(calendar.expanded, false, "collapsed after a reload");

  await player.page.locator("#sdc-calendar button[data-action=toggleCalendar]").click();
  await player.page.waitForTimeout(400);
  calendar = await readCalendar(player);
  assert(calendar.expanded && (calendar.visualHeight > 100), `not expanded again: ${JSON.stringify(calendar)}`);
});

test("a change of time plays out on the calendar", async ctx => {
  const start = await setTime(ctx, { year: 1525, day: 100, hour: 8 });
  await setClientSettings(ctx.player, { animate: true });
  await ctx.gm.eval(() => game.time.advance(86400));
  const midway = await waitFor(ctx.player, ({ start }) => {
    const shown = dnd5e.ui.calendar.shownTime;
    return (dnd5e.ui.calendar.animating && (shown > start + 3600) && (shown < start + 82800)) ? shown : null;
  }, { start }, "the calendar to be part way through the change");
  assert(midway > start, `shown time ${midway}`);
  await waitForShown(ctx.player, start + 86400);
});

test("the calendar follows the user's choice to hide it", async ({ player }) => {
  await player.eval(() => game.settings.set("dnd5e", "calendarPreferences", {
    visible: false, formatters: { date: "monthDay", time: "hoursMinutes" }
  }));
  await waitFor(player, () => !document.getElementById("sdc-calendar"), null, "the calendar to close");
});

/* -------------------------------------------- */
/*  Other Calendars                             */
/* -------------------------------------------- */

test("the Calendar of Greyhawk has Luna and Celene", async ctx => {
  const { gm, player } = ctx;
  try {
    await useCalendar(gm, "greyhawk");
    await player.reload();
    // Both moons are full on the fourth day of Needfest 576 CY, and high at its midnight.
    await setTime(ctx, { year: 576, day: 3, hour: 0 });
    const calendar = await readCalendar(player);
    assertEqual([...calendar.moons].sort(), ["Celene: Full Moon", "Luna: Full Moon"], "moons");
    assertEqual(calendar.festival, "Needfest", "festival");
  } finally {
    if ( await useCalendar(gm, "harptos") ) await player.reload();
  }
});
