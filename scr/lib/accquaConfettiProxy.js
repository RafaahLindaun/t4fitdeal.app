import baseConfetti from "canvas-confetti/dist/confetti.module.mjs";

const ACCQUA_YELLOW_CONFETTI = Object.freeze([
  "#FFD11E",
  "#FFDA33",
  "#FFE466",
  "#F4C800",
]);

function yellowOptions(options = {}) {
  return { ...options, colors: ACCQUA_YELLOW_CONFETTI };
}

function accquaConfetti(options) {
  return baseConfetti(yellowOptions(options));
}

accquaConfetti.reset = (...args) => baseConfetti.reset(...args);
accquaConfetti.shapeFromPath = (...args) => baseConfetti.shapeFromPath(...args);
accquaConfetti.shapeFromText = (...args) => baseConfetti.shapeFromText(...args);
accquaConfetti.create = (canvas, globalOptions) => {
  const created = baseConfetti.create(canvas, globalOptions);
  const fire = (options) => created(yellowOptions(options));
  fire.reset = (...args) => created.reset?.(...args);
  return fire;
};

export { ACCQUA_YELLOW_CONFETTI };
export default accquaConfetti;
