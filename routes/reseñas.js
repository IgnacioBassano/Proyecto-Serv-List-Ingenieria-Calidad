import express from "express";
import { PrismaClient } from "@prisma/client";
import { verificarToken } from "../middlewares/auth.js";

const prisma = new PrismaClient();
const router = express.Router();

// 📝 Obtener reseñas de un servicio
router.get("/servicio/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const reseñas = await prisma.reseña.findMany({
      where: { servicioId: Number(id) },
      orderBy: { createdAt: "desc" },
    });
    res.json(reseñas);
  } catch (error) {
    console.error("❌ Error al obtener reseñas:", error);
    res.status(500).json({ error: "Error al obtener reseñas" });
  }
});

// ✍️ Crear una reseña (pública, sin necesidad de login)
router.post("/", async (req, res) => {
  try {
    const { nombre, email, comentario, puntaje, servicioId } = req.body;

    if (!nombre || !email || !comentario || !puntaje || !servicioId)
      return res.status(400).json({ error: "Todos los campos son obligatorios" });

    const nueva = await prisma.reseña.create({
      data: {
        nombre,
        email,
        comentario,
        puntaje: Number(puntaje),
        servicioId: Number(servicioId),
      },
    });

    res.status(201).json({ message: "✅ Reseña enviada correctamente", reseña: nueva });
  } catch (error) {
    console.error("❌ Error al crear reseña:", error);
    res.status(500).json({ error: "Error al crear reseña" });
  }
});

// 🧾 Obtener reseñas del prestador logueado
router.get("/mias", verificarToken, async (req, res) => {
  try {
    const reseñas = await prisma.reseña.findMany({
      where: { servicio: { usuarioId: req.user.id } },
      include: { servicio: { select: { titulo: true } } },
      orderBy: { createdAt: "desc" },
    });

    res.json(reseñas.map(r => ({
      id: r.id,
      servicio: r.servicio.titulo,
      comentario: r.comentario,
      puntaje: r.puntaje,
      nombre: r.nombre,
      email: r.email,
      fecha: r.createdAt
    })));
  } catch (error) {
    console.error("❌ Error al obtener reseñas del prestador:", error);
    res.status(500).json({ error: "Error al obtener reseñas" });
  }
});

export default router;
