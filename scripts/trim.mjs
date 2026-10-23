import { ADVENTURES } from "./trim-adventures.mjs";
import { CAMPAIGNS } from "./trim-campaigns.mjs";
import { FESTIVALS } from "./trim-festivals.mjs";
import { HOLIDAYS } from "./trim-holidays.mjs";
import { BAR_MIDDLE, BAR_OUTLINE, BOWL_OUTLINE, seededRandom } from "./trim-path.mjs";
import { SEASONS } from "./trim-seasons.mjs";
import { WORLDS } from "./trim-worlds.mjs";

/**
 * The calendar's trim: the sky's, round the bowl about the day wheel, for the season or a festival; and the bar's,
 * along its lower edge, for an adventure.
 */

export { BAR_OUTLINE, BOWL_OUTLINE, seededRandom };
export { festivalTrimKind } from "./trim-festivals.mjs";

/** How the sky is dressed for each festival or holiday. */
const DAYS = { ...FESTIVALS, ...HOLIDAYS };

/**
 * The GM's choices for the sky's trim: none, the season of the day, or one season all year round.
 * @type {string[]}
 */
export const SKY_TRIM_CHOICES = ["none", "follow", ...Object.keys(SEASONS)];

/** How the bar is dressed for each adventure or setting. */
const BAR_TRIMS = { ...ADVENTURES, ...CAMPAIGNS, ...WORLDS };

/**
 * The GM's choices for the bar's trim: none, then each adventure or setting in the order of its English name, leaving
 * out a leading "The".
 * @type {string[]}
 */
export const BAR_TRIM_CHOICES = ["none",
  "acqinc", "arcana", "thay", "astarion", "glory", "manythings", "candlekeep", "ravenloft", "avernus", "delves",
  "icespire", "dragonlance", "stormwreck", "madmage", "eberron", "exandria", "realms", "saltmarsh", "greyhawk",
  "borderlands", "dragonqueen", "holdbackdead", "radiantcitadel", "goldenvault", "locathah", "lorwyn", "kwalish",
  "phandelver", "netheril", "underdark", "obelisk", "planescape", "elemental", "staircase", "ravnica", "icewind",
  "tiamat", "scions", "spelljammer", "giants", "strixhaven", "yawningportal", "theros", "chult", "unicorn", "vecna",
  "dragonheist", "feywild", "warcraft"];

/**
 * Every bar trim's key, for checking the choices against.
 * @type {string[]}
 */
export const BAR_TRIM_KINDS = Object.keys(BAR_TRIMS);

/**
 * The sky's trim for a season or a festival, round the bowl's rim.
 * @param {string|null} kind  A season ("winter", "spring", "summer", "fall"), or a festival.
 * @returns {string}  SVG markup, empty for no known kind.
 */
export function skyTrim(kind) {
  const draw = Object.hasOwn(SEASONS, kind) ? SEASONS[kind] : Object.hasOwn(DAYS, kind) ? DAYS[kind] : null;
  return draw ? draw(BOWL_OUTLINE, seededRandom(23), () => "") : "";
}

/**
 * The bar's trim for an adventure, along its lower edge. Pieces over the date are marked "middle", so they can be
 * left bare while the sky shows.
 * @param {string|null} kind  An adventure.
 * @returns {string}  SVG markup, empty for no known kind.
 */
export function barTrim(kind) {
  if ( !Object.hasOwn(BAR_TRIMS, kind) ) return "";
  const middle = p => ((p.x > BAR_MIDDLE[0]) && (p.x < BAR_MIDDLE[1]) ? " middle" : "");
  return BAR_TRIMS[kind](BAR_OUTLINE, seededRandom(11), middle);
}

/**
 * The kind of trim to dress the sky in.
 * @param {string|boolean} choice   The GM's choice. `true` is the setting from before it had choices, when it was on.
 * @param {string|null} season      The kind of the current season, for "follow".
 * @param {string|null} [festival]  The kind of trim for today's festival, if any, which "follow" puts up for the day.
 * @returns {string|null}
 */
export function skyTrimKind(choice, season, festival = null) {
  if ( (choice === true) || (choice === "true") || (choice === "follow") ) return festival ?? season ?? null;
  return Object.hasOwn(SEASONS, choice) ? choice : null;
}
