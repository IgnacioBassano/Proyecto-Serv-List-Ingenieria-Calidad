// tests/integration/turnos.test.js

const request = require("supertest");
const app = require("../../server");

// ---------------------------------
// 🔹 Prueba de Integración 2
// ---------------------------------
describe("POST /api/turnos", () => {
  test("Debe devolver 400 si faltan nombre y email", async () => {
    const res = await request(app)
      .post("/api/turnos")
      .send({
        servicioId: 1,
        detalle: "Detalle prueba",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/nombre y email/i);
  });

  test("Debe devolver 400 si falta servicioId", async () => {
    const res = await request(app)
      .post("/api/turnos")
      .send({
        nombre: "Nacho",
        email: "nacho@example.com",
        detalle: "Prueba sin servicioId",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/servicio/i);
  });
});
