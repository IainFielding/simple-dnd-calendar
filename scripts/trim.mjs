/**
 * The season's trim along the calendar's outline: icicles and frost in winter, a flowering vine in spring,
 * sunflowers in summer, and fallen leaves in autumn. Each outline is a path walked by length, and the trim is drawn
 * along it in SVG, with each piece turned so its "down" faces out from the frame.
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
const BAR_MIDDLE = [180, 420];

/* -------------------------------------------- */

const f = n => n.toFixed(1);

/**
 * A point on an outline, pushed out along its normal, and the turn that faces a piece's "down" outwards there.
 * @param {Outline} path
 * @param {number} s
 * @param {number} [offset]
 * @returns {{x: number, y: number, deg: number}}
 */
function point(path, s, offset = 0) {
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
function place(p, turn = 0, scale = 1) {
  const s = scale === 1 ? "" : ` scale(${scale.toFixed(2)})`;
  return `transform="translate(${f(p.x)} ${f(p.y)}) rotate(${f(p.deg + turn)})${s}"`;
}

/**
 * A line following an outline at a varying distance from it.
 * @param {Outline} path
 * @param {(s: number) => number} offset
 * @returns {string}  SVG path data.
 */
function follow(path, offset) {
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
function walk(path, random, min, max, fn) {
  for ( let s = min * random(); s < path.length; s += min + ((max - min) * random()) ) fn(s);
}

const pick = (random, list) => list[Math.floor(random() * list.length)];

/* -------------------------------------------- */
/*  The Seasons                                 */
/* -------------------------------------------- */

const LEAF = "M0,0Q2.5,-2.2 6,0Q2.5,2.2 0,0Z";
const MAPLE = "M0,5L.6,2.4L3.4,3.2L2.6,1.6L5,-.6L3.4,-1L3.8,-3.4L1.6,-2.4L0,-5L-1.6,-2.4L-3.8,-3.4L-3.4,-1L-5,-.6"
  + "L-2.6,1.6L-3.4,3.2L-.6,2.4Z";

/** How each season dresses an outline. Each piece is handed the class to add to it. */
const SEASONS = {
  /** Frost along the edge, a crust of rime, hanging icicles, and glinting crystals. */
  winter(path, random, cls) {
    const parts = [`<path class="sdc-frost" d="${follow(path, () => 0.3)}"/>`];
    walk(path, random, 2.5, 5, s => {
      if ( random() < 0.35 ) return;
      const p = point(path, s, (random() * 1.6) - 0.6);
      parts.push(`<circle class="sdc-rime${cls(p)}" cx="${f(p.x)}" cy="${f(p.y)}" r="${f(0.7 + random())}"/>`);
    });
    // Icicles hang straight down, so only where the edge faces downwards, and shorter where it is steep.
    walk(path, random, 9, 20, s => {
      const count = 1 + Math.floor(random() * 3);
      for ( let i = 0; i < count; i++ ) {
        const down = Math.sin(path.at(s + (i * 3.4)).n);
        if ( down < 0.45 ) continue;
        const p = { ...point(path, s + (i * 3.4)), deg: 0 };
        const w = 1.1 + random();
        const length = ((i ? 3 : 6) + (random() * (i ? 6 : 9))) * down;
        parts.push(`<polygon class="sdc-icicle${cls(p)}" ${place(p)} points="${f(-w)},-1 ${f(w)},-1 0,${f(length)}"/>`);
      }
    });
    walk(path, random, 24, 46, s => {
      const p = point(path, s, 1 + (random() * 3));
      parts.push(`<path class="sdc-glint${cls(p)}" ${place(p, random() * 60, 0.7 + (random() * 0.6))} `
        + `style="animation-delay: -${f(random() * 4)}s" d="M0,-3V3M-2.6,-1.5L2.6,1.5M-2.6,1.5L2.6,-1.5"/>`);
    });
    return parts.join("");
  },

  /** A thin vine with new leaves, and blossoms of pink, white, and lilac. */
  spring(path, random, cls) {
    const phase = random() * 10;
    const wave = s => 1 + (1.8 * Math.sin((s / 7) + phase));
    const parts = [`<path class="sdc-vine" d="${follow(path, wave)}"/>`];
    let side = 1;
    walk(path, random, 6, 10, s => {
      const p = point(path, s, wave(s));
      side = -side;
      parts.push(`<path class="sdc-leaf${random() < 0.5 ? " light" : ""}${cls(p)}" `
        + `${place(p, side * (40 + (random() * 40)), 0.7 + (random() * 0.4))} d="${LEAF}"/>`);
    });
    walk(path, random, 20, 36, s => {
      const p = point(path, s, 1.5 + (random() * 2));
      const kind = pick(random, ["pink", "white", "lilac"]);
      const petals = Array.from({ length: 5 }, (_, i) => {
        const a = (i * 72 * Math.PI) / 180;
        return `<circle cx="${f(1.9 * Math.cos(a))}" cy="${f(1.9 * Math.sin(a))}" r="1.6"/>`;
      }).join("");
      parts.push(`<g class="sdc-blossom ${kind}${cls(p)}" ${place(p, random() * 72, 0.8 + (random() * 0.5))}>`
        + `${petals}<circle class="heart" r="1"/></g>`);
    });
    return parts.join("");
  },

  /** A lush vine with sunflowers, and motes of light drifting about it. */
  summer(path, random, cls) {
    const phase = random() * 10;
    const wave = s => 1 + (1.2 * Math.sin((s / 9) + phase));
    const parts = [`<path class="sdc-vine summer" d="${follow(path, wave)}"/>`];
    let side = 1;
    walk(path, random, 5, 8, s => {
      const p = point(path, s, wave(s));
      side = -side;
      parts.push(`<path class="sdc-leaf summer${cls(p)}" ${place(p, side * (35 + (random() * 45)), 0.9 + (random() * 0.5))} `
        + `d="${LEAF}"/>`);
    });
    walk(path, random, 38, 60, s => {
      const p = point(path, s, 3);
      const petals = Array.from({ length: 10 }, (_, i) => `<ellipse rx="1" ry="2.4" cy="-3" transform="rotate(${i * 36})"/>`);
      parts.push(`<g class="sdc-sunflower${cls(p)}" ${place(p, random() * 36, 0.9 + (random() * 0.35))}>`
        + `${petals.join("")}<circle class="heart" r="2.1"/></g>`);
    });
    walk(path, random, 14, 26, s => {
      const p = point(path, s, 4 + (random() * 6));
      parts.push(`<circle class="sdc-mote${cls(p)}" cx="${f(p.x)}" cy="${f(p.y)}" r="${f(0.6 + (random() * 0.6))}" `
        + `style="animation-delay: -${f(random() * 4)}s"/>`);
    });
    return parts.join("");
  },

  /** A bare twig, with leaves of red, orange, and brown caught along it and a few fallen loose. */
  fall(path, random, cls) {
    const phase = random() * 10;
    const parts = [`<path class="sdc-twig" d="${follow(path, s => 0.8 + (0.8 * Math.sin((s / 11) + phase)))}"/>`];
    const leaf = (s, offset, scale, extra = "") => {
      const p = point(path, s, offset);
      const colour = pick(random, ["red", "orange", "amber", "brown", "rust"]);
      const shape = random() < 0.6 ? MAPLE : LEAF;
      const size = shape === MAPLE ? scale : scale * 1.4;
      parts.push(`<path class="sdc-fallen ${colour}${extra}${cls(p)}" ${place(p, random() * 360, size)} d="${shape}"/>`);
    };
    walk(path, random, 6, 12, s => leaf(s, -1 + (random() * 5), 0.5 + (random() * 0.4)));
    walk(path, random, 40, 70, s => leaf(s, 8 + (random() * 4), 0.4 + (random() * 0.25), " loose"));
    return parts.join("");
  }
};

/**
 * The trim for a kind of season, for the bar and the bowl.
 * @param {string|null} kind  "spring", "summer", "fall", or "winter".
 * @returns {{bar: string, bowl: string}}  SVG markup for each, empty for a season of no known kind.
 */
export function seasonTrim(kind) {
  const draw = SEASONS[kind];
  if ( !draw ) return { bar: "", bowl: "" };
  const middle = p => ((p.x > BAR_MIDDLE[0]) && (p.x < BAR_MIDDLE[1]) ? " middle" : "");
  return {
    bar: draw(BAR_OUTLINE, seededRandom(11), middle),
    bowl: draw(BOWL_OUTLINE, seededRandom(23), () => "")
  };
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
