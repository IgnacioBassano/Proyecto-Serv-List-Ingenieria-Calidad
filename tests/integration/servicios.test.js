// tests/integration/servicios.test.js

const request = require("supertest");
const app = require("../../server");

// ---------------------------------
// 🔹 Prueba de Integración 1
// ---------------------------------
describe("GET /api/servicios", () => {
  test("Debe devolver 200 y un array", async () => {
    const res = await request(app).get("/api/servicios");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
