const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const imagenPorCategoria = {
  "Electricista": "/assets/marioelectricista.png",
  "Plomería": "/assets/plomero.png",
  "Carpintería": "/assets/carpintero.png",
  "Limpieza": "/assets/limpieza.png",
};


app.get("/api/servicios", async (req, res) => {
  const { categoria = "", ubicacion = "", q = "" } = req.query;

  
  const where = {
    AND: [
      categoria ? { categoria } : {},
      ubicacion ? { ubicacion } : {},
      q
        ? {
            OR: [
              { titulo: { contains: q } },
              { comentario: { contains: q } },
            ],
          }
        : {},
    ],
  };

  try {
    const servicios = await prisma.servicio.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    res.json(servicios);
  } catch (err) {
    console.error("❌ Error en findMany:", err);
    res.status(500).json({ error: "Error en la base de datos" });
  }
});


app.get("/api/servicios/:id", async (req, res) => {
  const id = Number(req.params.id);
  try {
    const s = await prisma.servicio.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!s) return res.status(404).json({ error: "No encontrado" });

    const adaptado = { ...s, items: s.items?.map((it) => it.nombre) || [] };
    res.json(adaptado);
  } catch (err) {
    console.error("❌ Error en findUnique:", err);
    res.status(500).json({ error: "Error en la base de datos" });
  }
});


app.post("/api/servicios", async (req, res) => {
  const { titulo, categoria, ubicacion, comentario, imagen, email, descripcion, items } = req.body;
  if (!titulo || !categoria || !ubicacion || !comentario) {
    return res.status(400).json({ error: "Campos obligatorios: titulo, categoria, ubicacion, comentario" });
  }

  try {
    const creado = await prisma.servicio.create({
      data: {
        titulo,
        categoria,
        ubicacion,
        comentario,
        imagen: imagen || imagenPorCategoria[categoria] || "/assets/placeholder.jpg",
        email: email || "contacto@example.com",
        descripcion: descripcion || "",
        rating: 4.0,
        items: Array.isArray(items)
          ? { create: items.map((nombre) => ({ nombre })) }
          : undefined,
      },
    });
    res.status(201).json(creado);
  } catch (err) {
    console.error("❌ Error en create servicio:", err);
    res.status(500).json({ error: "No se pudo crear el servicio" });
  }
});


app.post("/api/turnos", async (req, res) => {
  const { nombre, email, fecha, detalle, servicioId } = req.body;
  if (!nombre || !email) return res.status(400).json({ error: "Campos obligatorios: nombre, email" });

  try {
    const turno = await prisma.turno.create({
      data: {
        nombre,
        email,
        detalle: detalle || "",
        fecha: fecha ? new Date(fecha) : null,
        servicioId: servicioId ? Number(servicioId) : null,
      },
    });
    res.status(201).json(turno);
  } catch (err) {
    console.error("❌ Error en create turno:", err);
    res.status(500).json({ error: "No se pudo crear el turno" });
  }
});


app.use(express.static(path.join(__dirname, "public")));


app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Serv-list en http://localhost:${PORT}`);
});

