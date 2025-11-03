const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { verificarToken } = require("../middlewares/auth");

const prisma = new PrismaClient();
const router = express.Router();


// 📝 Obtener reseñas de un servicio
router.get("/servicio/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const resenas = await prisma.resena.findMany({
      where: { servicioId: Number(id) },
      orderBy: { createdAt: "desc" },
    });
    res.json(resenas);
  } catch (error) {
    console.error("❌ Error al obtener reseñas:", error);
    res.status(500).json({ error: "Error al obtener reseñas" });
  }
});

// ✍️ Crear una reseña (pública, sin login)
router.post("/", async (req, res) => {
  try {
    const { nombre, email, comentario, puntaje, servicioId } = req.body;
    if (!nombre || !email || !comentario || !puntaje || !servicioId) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    const nueva = await prisma.resena.create({
      data: {
        nombre,
        email,
        comentario,
        puntaje: Number(puntaje),
        servicioId: Number(servicioId),
      },
    });

    res.status(201).json({
      message: "✅ Reseña enviada correctamente",
      reseña: nueva,
    });
  } catch (error) {
    console.error("❌ Error al crear reseña:", error);
    res.status(500).json({ error: "Error al crear reseña" });
  }
});

// 🧾 Obtener reseñas del prestador logueado
router.get("/mias", verificarToken, async (req, res) => {
  try {
    const resenas = await prisma.resena.findMany({
      where: { servicio: { usuarioId: req.user.id } },
      include: { servicio: { select: { titulo: true } } },
      orderBy: { createdAt: "desc" },
    });

    const formateadas = resenas.map(r => ({
      id: r.id,
      servicio: r.servicio.titulo,
      comentario: r.comentario,
      puntaje: r.puntaje,
      nombre: r.nombre,
      email: r.email,
      fecha: r.createdAt.toLocaleString("es-AR"),
    }));

    res.json(formateadas);
  } catch (error) {
    console.error("❌ Error al obtener reseñas del prestador:", error);
    res.status(500).json({ error: "Error al obtener reseñas" });
  }
});

module.exports = router;

