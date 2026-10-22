import { dateToTime, moonEventLabels, moonPhases } from "./calendar.mjs";

/**
 * The moons in D&D 5e's Set Date dialog: each moon's phase on the date being picked, and whether any are full or new
 * that day, updated as the date changes.
 */

/**
 * Listen for the dialog to render.
 */
export function registerSetDateHooks() {
  Hooks.on("renderSetDateDialog", (app, element) => addMoons(app, element));
}

/* -------------------------------------------- */

/**
 * Add the moons to the dialog, beneath the date.
 * @param {ApplicationV2} app
 * @param {HTMLElement} element
 */
function addMoons(app, element) {
  if ( !moonPhases().length ) return;
  const form = app.form ?? element.querySelector("form");
  const fields = element.querySelector(".split-group");
  if ( !form || !fields || element.querySelector(".sdc-set-date-moons") ) return;
  const list = document.createElement("ul");
  list.className = "sdc-set-date-moons unlist";
  fields.after(list);
  const update = () => {
    const read = name => Number(form.elements[name]?.value);
    const time = dateToTime({ year: read("year"), month: read("month"), day: read("day") });
    list.replaceChildren(...(time === null ? [] : moonRows(time)));
  };
  form.addEventListener("input", update);
  form.addEventListener("change", update);
  update();
}

/* -------------------------------------------- */

/**
 * The rows for the moons on a date.
 * @param {number} time
 * @returns {HTMLLIElement[]}
 */
function moonRows(time) {
  const row = (icon, text, className) => {
    const li = document.createElement("li");
    if ( className ) li.className = className;
    const i = document.createElement("i");
    i.className = icon;
    li.append(i, " ", text);
    return li;
  };
  return [
    ...moonPhases(time).map(({ name, phaseName }) => row("fa-solid fa-moon", `${name}: ${phaseName}`)),
    ...moonEventLabels(time).map(label => row("fa-solid fa-circle", label, "sdc-event"))
  ];
}
