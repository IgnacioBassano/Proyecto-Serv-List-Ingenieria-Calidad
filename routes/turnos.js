import express from "express";
import { PrismaClient } from "@prisma/client";
import { verificarToken } from "../middlewares/auth.js";

const prisma = new PrismaClient();
const router = express.Router();

// ============================================
// 📅 Obtener los turnos del prestador logueado
// ============================================
router.get("/mios", verificarToken, async (req, res) => {
  try {
    const turnos = await prisma.turno.findMany({
      where: { servicio: { usuarioId: req.user.id } },
      include: {
        servicio: {
          select: { titulo: true, categoria: true, ubicacion: true },
        },
      },
      orderBy: { fecha: "desc" },
    });

    const data = turnos.map((t) => ({
      id: t.id,
      fecha: t.fecha,
      hora: t.fecha ? new Date(t.fecha).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) : "-",
      comentario: t.detalle,
      estado: t.estado || "pendiente",
      servicio: {
        titulo: t.servicio?.titulo || "Sin servicio",
        categoria: t.servicio?.categoria || "",
        ubicacion: t.servicio?.ubicacion || "",
      },
      cliente: {
        nombre: t.nombre,
        email: t.email,
      },
    }));

    res.json(data);
  } catch (error) {
    console.error("❌ Error al obtener turnos:", error);
    res.status(500).json({ error: "Error al obtener los turnos" });
  }
});

// ============================================
// 🗓️ Crear nuevo turno (cliente solicita turno)
// ============================================
router.post("/", verificarToken, async (req, res) => {
  try {
    const { nombre, email, fecha, detalle, servicioId } = req.body;

    if (!nombre || !email || !servicioId) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    const nuevoTurno = await prisma.turno.create({
      data: {
        nombre,
        email,
        fecha: fecha ? new Date(fecha) : null,
        detalle,
        servicio: { connect: { id: Number(servicioId) } },
      },
    });

    res.status(201).json({ message: "Turno creado correctamente", turno: nuevoTurno });
  } catch (error) {
    console.error("❌ Error al crear turno:", error);
    res.status(500).json({ error: "No se pudo crear el turno" });
  }
});

// ============================================
// 🔄 Actualizar estado de un turno
// ============================================
router.put("/:id/estado", verificarToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!["pendiente", "confirmado", "cancelado"].includes(estado)) {
      return res.status(400).json({ error: "Estado inválido" });
    }

    const turno = await prisma.turno.findUnique({
      where: { id: Number(id) },
      include: { servicio: true },
    });

    if (!turno) return res.status(404).json({ error: "Turno no encontrado" });

    if (turno.servicio?.usuarioId !== req.user.id && req.user.rol !== "ADMIN") {
      return res.status(403).json({ error: "No autorizado" });
    }

    const actualizado = await prisma.turno.update({
      where: { id: Number(id) },
      data: { estado },
    });

    res.json({ message: "Estado actualizado correctamente", turno: actualizado });
  } catch (error) {
    console.error("❌ Error al actualizar estado:", error);
    res.status(500).json({ error: "Error al cambiar el estado del turno" });
  }
});

// ============================================
// 👀 Obtener turnos de un prestador específico (admin o dueño)
// ============================================
router.get("/prestador/:id", verificarToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (parseInt(id) !== req.user.id && req.user.rol !== "ADMIN") {
      return res.status(403).json({ error: "No autorizado para ver estos turnos" });
    }

    const turnos = await prisma.turno.findMany({
      where: { servicio: { usuarioId: parseInt(id) } },
      include: {
        servicio: { select: { titulo: true, categoria: true } },
      },
      orderBy: { fecha: "desc" },
    });

    const data = turnos.map((t) => ({
      id: t.id,
      nombre: t.nombre,
      email: t.email,
      fecha: t.fecha,
      detalle: t.detalle,
      estado: t.estado,
      servicio: t.servicio?.titulo || "Sin servicio",
    }));

    res.json(data);
  } catch (error) {
    console.error("❌ Error al obtener turnos del prestador:", error);
    res.status(500).json({ error: "Error al obtener los turnos" });
  }
});

export default router;
