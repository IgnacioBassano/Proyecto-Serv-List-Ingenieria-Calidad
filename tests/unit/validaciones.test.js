// tests/unit/validaciones.test.js

const {
  esEmailValido,
  esPasswordFuerte,
} = require("../../utils/validaciones");

// ----------------------------
// 🔹 Prueba Unitaria 1
// ----------------------------
test("esEmailValido devuelve true para un email válido", () => {
  expect(esEmailValido("nacho@example.com")).toBe(true);
});

// ----------------------------
// 🔹 Prueba Unitaria 2
// ----------------------------
test("esPasswordFuerte devuelve false para password débil", () => {
  expect(esPasswordFuerte("12345")).toBe(false);
});
