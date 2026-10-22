import { festivalName, formatComponents, moonEventLabels, worldMoons } from "./calendar.mjs";
import { MODULE_ID } from "./constants.mjs";
import * as sky from "./sky.mjs";
import { seasonTrim, seededRandom } from "./trim.mjs";

/**
 * The shape of the sky picture under the control bar, in CSS pixels. The bowl and the day wheel share a centre above
 * the picture's top edge, so only the lower part of each shows: the bowl as a deep half-dish, the wheel as the arc
 * of whichever half of the day is turned down into view.
 */
export const SKY = Object.freeze({ width: 320, height: 120, cx: 160, cy: -40, bowl: 160, wheel: 100, orbit: 128 });

/** The season bar's width. Its background is one year three times this wide, so a third of the year shows. */
const SEASON_BAR_WIDTH = 460;

/** A moon's radius on the bowl. */
const MOON_RADIUS = 13;

/** How long a change of time takes to play out: this many milliseconds per tenfold step in the days passed. */
const ANIMATION_MS = 1400;

/** The longest a change of time takes to play out, however far it jumps. */
const ANIMATION_MAX_MS = 6000;

/** The Font Awesome icon for each part of the day. */
const PHASE_ICONS = {
  dawn: "fa-solid fa-sunrise",
  day: "fa-solid fa-sun",
  dusk: "fa-solid fa-sunset",
  night: "fa-solid fa-moon-stars"
};

/**
 * Build the calendar HUD on top of D&D 5e's own, so it keeps the system's calendar choice, date and time formats,
 * time controls, Set Date dialog, sheet buttons, and the buttons other modules add with the
 * `dnd5e.prepareCalendarButtons` hook. It is built when D&D 5e has loaded, as its class is the base.
 * @param {typeof dnd5e.applications.calendar.CalendarHUD} CalendarHUD
 * @returns {typeof CalendarHUD}
 */
export function createCalendarHUD(CalendarHUD) {
  return class SimpleCalendarHUD extends CalendarHUD {

    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
      id: "sdc-calendar",
      classes: ["sdc-calendar", "themed", "theme-dark"],
      tag: "aside",
      actions: {
        toggleCalendar: SimpleCalendarHUD.#onToggle
      }
    };

    /** @override */
    static PARTS = {
      startButtons: {
        classes: ["calendar-buttons", "sdc-controls", "sdc-start"],
        template: `modules/${MODULE_ID}/templates/calendar-buttons.hbs`
      },
      core: {
        classes: ["sdc-core"],
        template: `modules/${MODULE_ID}/templates/calendar-core.hbs`
      },
      endButtons: {
        classes: ["calendar-buttons", "sdc-controls", "sdc-end"],
        template: `modules/${MODULE_ID}/templates/calendar-buttons.hbs`
      }
    };

    /* -------------------------------------------- */

    /**
     * The world time the picture shows, which trails the real world time while a change plays out.
     * @type {number|null}
     */
    #shown = null;

    /**
     * The change of time playing out, if any.
     * @type {{from: number, to: number, start: number, duration: number}|null}
     */
    #tween = null;

    /** @type {number|null} */
    #frame = null;

    /**
     * Elements of the core part, found once it renders. The core part is drawn once and then only updated, so these
     * stay the same while the calendar is open.
     * @type {Record<string, HTMLElement|SVGElement>}
     */
    #el = {};

    /**
     * The world's moons, with each one's epoch worked out and its element on the bowl.
     * @type {{config: object, epoch: number, element: HTMLElement, path: SVGPathElement, phase: number|null,
     *   label: string|null}[]}
     */
    #moons = [];

    /** The last text written to each label, so unchanged text isn't rewritten every frame. */
    #text = {};

    /* -------------------------------------------- */

    /**
     * Whether the sky picture is showing.
     * @type {boolean}
     */
    get expanded() {
      return game.settings.get(MODULE_ID, "expanded");
    }

    /**
     * The world time the calendar last drew, which trails the world time while a change of time plays out.
     * @type {number|null}
     */
    get shownTime() {
      return this.#shown;
    }

    /**
     * Whether a change of time is playing out.
     * @type {boolean}
     */
    get animating() {
      return !!this.#tween;
    }

    /* -------------------------------------------- */
    /*  Rendering                                   */
    /* -------------------------------------------- */

    /** @inheritDoc */
    _initializeApplicationOptions(options) {
      options = super._initializeApplicationOptions(options);
      // D&D 5e's HUD fades out with the rest of the interface when the pointer leaves it; this one stays as it is.
      options.classes = options.classes.filter(c => c !== "faded-ui");
      return options;
    }

    /* -------------------------------------------- */

    /** @override */
    _insertElement(element) {
      const existing = document.getElementById(element.id);
      if ( existing ) existing.replaceWith(element);
      else document.getElementById("ui-top")?.prepend(element);
    }

    /* -------------------------------------------- */

    /** @inheritDoc */
    _getCalendarButtons() {
      const buttons = super._getCalendarButtons();
      const icons = { reverse: "fa-solid fa-backward", advance: "fa-solid fa-forward" };
      for ( const button of buttons ) {
        if ( button.action in icons ) button.icon = icons[button.action];
      }
      buttons.unshift({
        action: "toggleCalendar",
        icon: "fa-solid fa-caret-down",
        position: "end",
        tooltip: _loc(this.expanded ? "SDC.Action.Collapse" : "SDC.Action.Expand"),
        visible: true
      });
      return buttons;
    }

    /* -------------------------------------------- */

    /** @inheritDoc */
    async _preparePartContext(partId, context, options) {
      context = await super._preparePartContext(partId, context, options);
      if ( partId === "core" ) Object.assign(context, this.#prepareSky());
      return context;
    }

    /* -------------------------------------------- */

    /**
     * The fixed parts of the sky picture: the bowl's stars, the wheel's rays and ticks, and the season bar.
     * @returns {object}
     */
    #prepareSky() {
      const { width, height, cx, cy, bowl, wheel } = SKY;
      const halfChord = Math.sqrt((bowl ** 2) - (cy ** 2));
      const random = seededRandom(5);
      const stars = [];
      while ( stars.length < 34 ) {
        const x = random() * width;
        const y = random() * height;
        const d = Math.hypot(x - cx, y - cy);
        if ( (d < wheel + 6) || (d > bowl - 6) ) continue;
        stars.push({ x: x.toFixed(1), y: y.toFixed(1), r: (0.4 + (random() * 0.9)).toFixed(2),
          o: (0.25 + (random() * 0.6)).toFixed(2) });
      }
      const point = (r, degrees) => {
        const a = degrees * Math.PI / 180;
        return `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`;
      };
      const ticks = Array.from({ length: 24 }, (_, i) => {
        const a = i * 15;
        return [point(wheel - 1, a - 2.2), point(wheel - 1, a + 2.2), point(wheel - (i % 6 ? 6 : 10), a)].join(" ");
      });
      const rays = Array.from({ length: 11 }, (_, i) => {
        const a = 15 + (i * 15);
        return [point(62, a - 4), point(62, a + 4), point(84, a)].join(" ");
      });
      const nightStars = Array.from({ length: 12 }, (_, i) => {
        const [x, y] = point(56 + ((i * 37) % 34), 195 + (i * 13.5)).split(",");
        return { x, y, r: (i % 3 ? 0.9 : 1.6) };
      });
      return {
        sky: SKY,
        bowlPath: `M${(cx - halfChord).toFixed(1)},0 A${bowl} ${bowl} 0 0 0 ${(cx + halfChord).toFixed(1)},0 Z`,
        rimPath: `M${(cx - halfChord).toFixed(1)},0 A${bowl} ${bowl} 0 0 0 ${(cx + halfChord).toFixed(1)},0`,
        stars, ticks, rays, nightStars,
        dayFace: sky.dayFacePaths(6, 18, 24, wheel),
        seasonGradient: sky.seasonGradient(game.time.calendar),
        seasonWidth: SEASON_BAR_WIDTH * 3
      };
    }

    /* -------------------------------------------- */

    /** @inheritDoc */
    async _onRender(context, options) {
      if ( options.parts.includes("core") ) this.#bindCore();
      this.element.classList.toggle("expanded", this.expanded);
      await super._onRender(context, options);
    }

    /* -------------------------------------------- */

    /**
     * Find the core part's elements and put the world's moons on the bowl.
     */
    #bindCore() {
      const find = selector => this.element.querySelector(selector);
      this.#el = {
        time: find(".sdc-time"),
        date: find(".sdc-date"),
        season: find(".sdc-season"),
        wheel: find(".sdc-wheel"),
        wheelDay: find(".sdc-wheel-day"),
        wheelDayClip: find(".sdc-wheel-day-clip"),
        wheelAxis: find(".sdc-wheel-axis"),
        phase: find(".sdc-phase"),
        barTrim: find(".sdc-trim-bar"),
        bowlTrim: find(".sdc-trim-bowl"),
        festivalIcon: find(".sdc-festival-icon"),
        moonEventIcon: find(".sdc-moon-event-icon"),
        moons: find(".sdc-moons")
      };
      this.#text = {};
      delete this.element.dataset.season;
      const calendar = game.time.calendar;
      this.#moons = worldMoons().map(config => {
        const size = MOON_RADIUS * 2;
        const element = document.createElement("div");
        element.className = "sdc-moon";
        element.style.setProperty("--moon-color", config.color);
        element.innerHTML = `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">`
          + `<circle class="dark" cx="${MOON_RADIUS}" cy="${MOON_RADIUS}" r="${MOON_RADIUS - 0.5}"/>`
          + `<path class="lit"/><circle class="edge" cx="${MOON_RADIUS}" cy="${MOON_RADIUS}" r="${MOON_RADIUS - 0.5}"/>`
          + "</svg>";
        this.#el.moons.append(element);
        return { config, epoch: sky.epochTime(calendar, config), element, path: element.querySelector(".lit"),
          phase: null, label: null };
      });
    }

    /* -------------------------------------------- */

    /**
     * Draw the current time, or leave it to a change of time that is playing out.
     * @override
     */
    async renderCore(_deltas) {
      if ( this.#tween ) return;
      this.#draw(game.time.worldTime);
    }

    /* -------------------------------------------- */

    /**
     * Redraw everything at the time shown, such as after a setting that changes the picture.
     */
    refresh() {
      this.#text = {};
      this.#draw(this.#shown ?? game.time.worldTime);
    }

    /* -------------------------------------------- */

    /** @inheritDoc */
    _onClose(options) {
      super._onClose(options);
      this.#stop();
      this.#el = {};
      this.#moons = [];
      this.#shown = null;
    }

    /* -------------------------------------------- */
    /*  Animation                                   */
    /* -------------------------------------------- */

    /**
     * Play a change of time out on the calendar: the clock runs, the wheel turns and the moons move from the time
     * shown to the new one, taking longer for longer jumps.
     * @param {number} worldTime  The new world time.
     */
    animateTo(worldTime) {
      if ( !this.rendered ) return;
      const from = this.#shown ?? worldTime;
      const days = Math.abs(worldTime - from) / sky.secondsPerDay(game.time.calendar);
      const duration = Math.min(ANIMATION_MAX_MS, Math.log10((220 * days) + 1) * ANIMATION_MS);
      if ( !game.settings.get(MODULE_ID, "animate") || (duration < 50) ) {
        this.#stop();
        this.#draw(worldTime);
        return;
      }
      this.#tween = { from, to: worldTime, start: performance.now(), duration };
      this.#frame ??= requestAnimationFrame(this.#step);
    }

    /* -------------------------------------------- */

    /**
     * Draw one frame of a change of time.
     * @param {number} now
     */
    #step = now => {
      this.#frame = null;
      const tween = this.#tween;
      if ( !tween || !this.rendered ) return;
      const t = Math.clamp((now - tween.start) / tween.duration, 0, 1);
      const eased = (1 - Math.cos(Math.PI * t)) / 2;
      this.#draw(tween.from + ((tween.to - tween.from) * eased));
      if ( t < 1 ) this.#frame = requestAnimationFrame(this.#step);
      else this.#tween = null;
    };

    /* -------------------------------------------- */

    /** Stop any change of time playing out. */
    #stop() {
      if ( this.#frame ) cancelAnimationFrame(this.#frame);
      this.#frame = null;
      this.#tween = null;
    }

    /* -------------------------------------------- */

    /**
     * Draw the calendar at a world time.
     * @param {number} time
     */
    #draw(time) {
      this.#shown = time;
      const el = this.#el;
      if ( !el.time ) return;
      const calendar = game.time.calendar;
      const components = calendar.timeToComponents(Math.floor(time));
      const fraction = sky.dayFraction(calendar, time);

      // Control bar: the day of the week and the time.
      const weekday = calendar.days.values[components.dayOfWeek];
      const day = weekday ? _loc(weekday.name).capitalize() : "";
      const clock = formatComponents(calendar, components, "time");
      this.#write("time", el.time, [day, clock].filter(Boolean).join(" – "));

      // The season's trim round the frame, and its name on the season band.
      const season = calendar.seasons.values[components.season];
      const seasonKey = season ? season.name : "";
      if ( this.#text.season !== seasonKey ) {
        this.#text.season = seasonKey;
        const kind = game.settings.get(MODULE_ID, "seasonTrim") ? (sky.seasonKind(seasonKey) ?? "") : "";
        el.season.dataset.tooltip = season ? _loc(season.name) : "";
        if ( this.element.dataset.season !== kind ) {
          this.element.dataset.season = kind;
          const trim = seasonTrim(kind);
          el.barTrim.innerHTML = trim.bar;
          el.bowlTrim.innerHTML = trim.bowl;
        }
      }
      if ( !this.expanded ) return;

      // Season bar: the date, over a year of seasons that slides by as it passes.
      this.#write("date", el.date, formatComponents(calendar, components, "date"));
      const year = sky.yearFraction(calendar, components, fraction);
      el.season.style.backgroundPositionX = `${Math.round((SEASON_BAR_WIDTH / 2) - (year * SEASON_BAR_WIDTH * 3))}px`;

      // The wheel, its day face as long as the day, and the part of the day.
      el.wheel.setAttribute("transform", `rotate(${sky.wheelRotation(fraction).toFixed(2)})`);
      const hoursPerDay = calendar.days.hoursPerDay;
      const hour = fraction * hoursPerDay;
      const sunrise = calendar.sunrise?.(components) ?? (hoursPerDay * 0.25);
      const sunset = calendar.sunset?.(components) ?? (hoursPerDay * 0.75);
      const daylight = `${sunrise.toFixed(2)}-${sunset.toFixed(2)}`;
      if ( this.#text.daylight !== daylight ) {
        this.#text.daylight = daylight;
        const { face, edges } = sky.dayFacePaths(sunrise, sunset, hoursPerDay, SKY.wheel);
        el.wheelDay.setAttribute("d", face);
        el.wheelDayClip.setAttribute("d", face);
        el.wheelAxis.setAttribute("d", edges);
      }
      const phase = sky.dayPhase(hour, sunrise, sunset);
      if ( this.#text.phase !== phase ) {
        this.#text.phase = phase;
        el.phase.className = `sdc-phase ${PHASE_ICONS[phase]}`;
        el.phase.dataset.phase = phase;
        el.phase.dataset.tooltip = _loc(`SDC.Phase.${phase.capitalize()}`);
      }

      // Any festival, beside the bowl.
      const festival = festivalName(calendar, components);
      if ( this.#text.festival !== festival ) {
        this.#text.festival = festival;
        el.festivalIcon.hidden = !festival;
        el.festivalIcon.dataset.tooltip = festival;
      }

      // Any full or new moons today, beside the festival.
      const today = Math.floor(time / sky.secondsPerDay(calendar));
      if ( this.#text.moonDay !== today ) {
        this.#text.moonDay = today;
        const events = moonEventLabels(time);
        el.moonEventIcon.hidden = !events.length;
        el.moonEventIcon.dataset.tooltip = events.map(foundry.utils.escapeHTML).join("<br>");
      }

      // The moons, riding the bowl while they are above the horizon.
      for ( const moon of this.#moons ) {
        const p = sky.moonPhase(calendar, moon.config, time, moon.epoch);
        const angle = sky.moonSkyAngle(fraction, p);
        const { x, y } = sky.orbitPoint(angle, { x: SKY.cx, y: SKY.cy, r: SKY.orbit });
        const visible = sky.aboveHorizon(angle) && (y > -MOON_RADIUS);
        moon.element.hidden = !visible;
        if ( !visible ) continue;
        moon.element.style.transform = `translate(${x - MOON_RADIUS}px, ${y - MOON_RADIUS}px)`;
        if ( (moon.phase === null) || (Math.abs(p - moon.phase) > 0.002) ) {
          moon.phase = p;
          moon.path.setAttribute("d", sky.moonPath(p, MOON_RADIUS));
        }
        const label = `${_loc(moon.config.name)}: ${_loc(`SDC.MoonPhase.${sky.phaseName(p)}`)}`;
        if ( moon.label !== label ) {
          moon.label = label;
          moon.element.dataset.tooltip = label;
        }
      }
    }

    /* -------------------------------------------- */

    /**
     * Write a label's text if it has changed.
     * @param {string} key
     * @param {HTMLElement} element
     * @param {string} text
     */
    #write(key, element, text) {
      if ( this.#text[key] === text ) return;
      this.#text[key] = text;
      element.innerText = text;
    }

    /* -------------------------------------------- */

    /*  Event Listeners and Handlers                */
    /* -------------------------------------------- */

    /**
     * Show or hide the sky picture.
     * @this {SimpleCalendarHUD}
     */
    static async #onToggle() {
      const expanded = !this.expanded;
      await game.settings.set(MODULE_ID, "expanded", expanded);
      this.element.classList.toggle("expanded", expanded);
      const button = this.element.querySelector("[data-action=toggleCalendar]");
      if ( button ) button.ariaLabel = _loc(expanded ? "SDC.Action.Collapse" : "SDC.Action.Expand");
      this.#text = {};
      this.#draw(this.#shown ?? game.time.worldTime);
    }

    /* -------------------------------------------- */

    /** @override */
    static onUpdateWorldTime(worldTime, _deltaTime, _options, _userId) {
      if ( this.shouldDisplay ) dnd5e.ui.calendar?.animateTo?.(worldTime);
    }
  };
}
