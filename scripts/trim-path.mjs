/**
 * The calendar frame's outlines, and helpers for drawing trim along them. Each outline is a path walked by length,
 * and trim is drawn along it in SVG, with each piece turned so its "down" faces out from the frame.
 */

/**
 * A walkable outline.
 * @typedef {object} Outline
 * @property {number} length
 * @property {(s: number) => {x: number, y: number, n: number}} at  The point at a distance along, and the angle of
 *   the outward normal there, in radians.
 */

/**
 * An arc about a centre, from one angle to another, its normal pointing away from the centre.
 * @returns {{length: number, at: (u: number) => {x: number, y: number, n: number}}}
 */
function arc(cx, cy, r, from, to) {
  return {
    length: Math.abs(to - from) * r,
    at: u => {
      const a = from + ((to - from) * u);
      return { x: cx + (r * Math.cos(a)), y: cy + (r * Math.sin(a)), n: a };
    }
  };
}

/**
 * A straight line, its normal at a fixed angle.
 * @returns {{length: number, at: (u: number) => {x: number, y: number, n: number}}}
 */
function line(x1, y1, x2, y2, n) {
  return { length: Math.hypot(x2 - x1, y2 - y1), at: u => ({ x: x1 + ((x2 - x1) * u), y: y1 + ((y2 - y1) * u), n }) };
}

/**
 * Join segments end to end into one outline.
 * @param {...object} segments
 * @returns {Outline}
 */
export function outline(...segments) {
  const length = segments.reduce((sum, seg) => sum + seg.length, 0);
  return {
    length,
    at(s) {
      s = Math.min(Math.max(s, 0), length);
      for ( const seg of segments ) {
        if ( s <= seg.length ) return seg.at(seg.length ? s / seg.length : 0);
        s -= seg.length;
      }
      return segments.at(-1).at(1);
    }
  };
}

/**
 * The control bar's lower edge, a pixel inside its border: down round the left corner, along the bottom, and up
 * round the right. The bar is 600 by 40 pixels, and its corners are as round as its height allows.
 */
export const BAR_OUTLINE = outline(
  arc(40, 0, 39, Math.PI, Math.PI / 2),
  line(40, 39, 560, 39, Math.PI / 2),
  arc(560, 0, 39, Math.PI / 2, 0)
);

/** The bowl's rim, in the sky picture's own space, from where it leaves the season band on the left to the right. */
export const BOWL_OUTLINE = (() => {
  const lip = Math.asin(40 / 160);
  return outline(arc(160, -40, 160, Math.PI - lip, lip));
})();

/** The stretch of the bar above the date, which is left bare while the sky shows. */
export const BAR_MIDDLE = [180, 420];

/* -------------------------------------------- */

export const f = n => n.toFixed(1);

/**
 * A point on an outline, pushed out along its normal, and the turn that faces a piece's "down" outwards there.
 * @param {Outline} path
 * @param {number} s
 * @param {number} [offset]
 * @returns {{x: number, y: number, deg: number}}
 */
export function point(path, s, offset = 0) {
  const { x, y, n } = path.at(s);
  return { x: x + (offset * Math.cos(n)), y: y + (offset * Math.sin(n)), deg: (n * 180 / Math.PI) - 90 };
}

/**
 * A transform attribute placing a piece at a point.
 * @param {{x: number, y: number, deg: number}} p
 * @param {number} [turn]   A further turn, in degrees.
 * @param {number} [scale]
 * @returns {string}
 */
export function place(p, turn = 0, scale = 1) {
  const s = scale === 1 ? "" : ` scale(${scale.toFixed(2)})`;
  return `transform="translate(${f(p.x)} ${f(p.y)}) rotate(${f(p.deg + turn)})${s}"`;
}

/**
 * A line following an outline at a varying distance from it.
 * @param {Outline} path
 * @param {(s: number) => number} offset
 * @returns {string}  SVG path data.
 */
export function follow(path, offset) {
  const points = [];
  for ( let s = 0; s <= path.length; s += 3 ) {
    const { x, y } = point(path, s, offset(s));
    points.push(`${f(x)},${f(y)}`);
  }
  return `M${points.join("L")}`;
}

/**
 * Walk an outline at uneven steps.
 * @param {Outline} path
 * @param {() => number} random
 * @param {number} min    The shortest step.
 * @param {number} max    The longest step.
 * @param {(s: number) => void} fn
 */
export function walk(path, random, min, max, fn) {
  for ( let s = min * random(); s < path.length; s += min + ((max - min) * random()) ) fn(s);
}

export const pick = (random, list) => list[Math.floor(random() * list.length)];

/**
 * A filled band along an outline, between two varying distances from it.
 * @param {Outline} path
 * @param {(s: number) => number} inner
 * @param {(s: number) => number} outer
 * @returns {string}  SVG path data.
 */
export function band(path, inner, outer) {
  const out = [];
  const back = [];
  for ( let s = 0; s <= path.length; s += 3 ) {
    const a = point(path, s, inner(s));
    const b = point(path, s, outer(s));
    out.push(`${f(a.x)},${f(a.y)}`);
    back.unshift(`${f(b.x)},${f(b.y)}`);
  }
  return `M${out.join("L")}L${back.join("L")}Z`;
}

/**
 * Swags hung along an outline: a cord pinned at uneven steps, sagging out from the frame between each pin.
 * @param {Outline} path
 * @param {() => number} random
 * @param {number} min    The shortest span.
 * @param {number} max    The longest span.
 * @param {number} sag    How far the cord sags at the middle of a span.
 * @returns {{d: string, pins: number[], lows: number[], sags: (s: number) => number}}  The cord's path data, where
 *   it is pinned, the middle of each span, and how far the cord hangs from the outline at a distance along it.
 */
export function swags(path, random, min, max, sag) {
  const pins = [0];
  while ( pins.at(-1) < path.length ) pins.push(Math.min(pins.at(-1) + min + ((max - min) * random()), path.length));
  const sags = s => {
    const i = pins.findIndex(p => p >= s);
    if ( i <= 0 ) return 0;
    const [a, b] = [pins[i - 1], pins[i]];
    return sag * Math.min(1, (b - a) / max) * Math.sin(Math.PI * (s - a) / (b - a));
  };
  const lows = pins.slice(1).map((b, i) => (pins[i] + b) / 2);
  return { d: follow(path, sags), pins, lows, sags };
}

/**
 * How much the outline faces downwards at a point, so a piece can hang straight down from it: 1 straight down, 0 or
 * less sideways or up.
 * @param {Outline} path
 * @param {number} s
 * @returns {number}
 */
export function facesDown(path, s) {
  return Math.sin(path.at(s).n);
}

/**
 * A small seeded random number generator, so a picture comes out the same from one render to the next.
 * @param {number} seed
 * @returns {() => number}
 */
export function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
