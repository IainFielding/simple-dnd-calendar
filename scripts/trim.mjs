import { ADVENTURES } from "./trim-adventures.mjs";
import { FESTIVALS } from "./trim-festivals.mjs";
import { BAR_MIDDLE, BAR_OUTLINE, BOWL_OUTLINE, seededRandom } from "./trim-path.mjs";
import { SEASONS } from "./trim-seasons.mjs";

/**
 * The trim along the calendar's frame: the season's, a festival's for the day, or an adventure's all year round.
 */

export { BAR_OUTLINE, BOWL_OUTLINE, seededRandom };
export { festivalTrimKind } from "./trim-festivals.mjs";

/**
 * The GM's choices for the frame's trim, in the groups the setting shows them in: none, the season of the day, one
 * season all year round, or an adventure's.
 * @type {Record<string, string[]>}
 */
export const TRIM_GROUPS = {
  "": ["none", "follow"],
  seasons: ["winter", "spring", "summer", "fall"],
  adventures: Object.keys(ADVENTURES)
};

/** @type {string[]} */
export const TRIM_CHOICES = Object.values(TRIM_GROUPS).flat();

/** Every trim, by kind. */
const TRIMS = { ...SEASONS, ...FESTIVALS, ...ADVENTURES };

/**
 * The trim for a season, a festival, or an adventure, for the bar and the bowl. An adventure's is drawn along the
 * bar alone.
 * @param {string|null} kind  A season ("winter", "spring", "summer", "fall"), a festival, or an adventure.
 * @returns {{bar: string, bowl: string}}  SVG markup for each, empty for no known kind.
 */
export function frameTrim(kind) {
  if ( !Object.hasOwn(TRIMS, kind) ) return { bar: "", bowl: "" };
  const draw = TRIMS[kind];
  const middle = p => ((p.x > BAR_MIDDLE[0]) && (p.x < BAR_MIDDLE[1]) ? " middle" : "");
  return {
    bar: draw(BAR_OUTLINE, seededRandom(11), middle),
    bowl: ADVENTURES[kind] ? "" : draw(BOWL_OUTLINE, seededRandom(23), () => "")
  };
}

/**
 * The kind of trim to dress the frame in.
 * @param {string|boolean} choice   The GM's choice. `true` is the setting from before it had choices, when it was on.
 * @param {string|null} season      The kind of the current season, for "follow".
 * @param {string|null} [festival]  The kind of trim for today's festival, if any, which "follow" puts up for the day.
 * @returns {string|null}
 */
export function trimKind(choice, season, festival = null) {
  if ( (choice === true) || (choice === "true") || (choice === "follow") ) return festival ?? season ?? null;
  return Object.hasOwn(SEASONS, choice) || Object.hasOwn(ADVENTURES, choice) ? choice : null;
}
