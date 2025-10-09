const express = require("express");
const cors = require("cors");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

const usuarioRoutes = require("./routes/usuario");

// =============================
// 🔒 Middleware JWT
// =============================
function verificarToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ error: "Falta token de autenticación" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "clave_secreta_dev");
    req.user = decoded;
    next();
  } catch (error) {
    console.error("❌ Token inválido o expirado:", error.message);
    return res.status(403).json({ error: "Token inválido o expirado" });
  }
}

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

// =============================
// 🧭 Rutas principales
// =============================
app.use("/api/usuarios", usuarioRoutes);

// =============================
// 📦 Imágenes por categoría
// =============================
const imagenPorCategoria = {
  Electricista: "/assets/marioelectricista.png",
  Plomería: "/assets/plomero.png",
  Carpintería: "/assets/carpintero.png",
  Limpieza: "/assets/limpieza.png",
};

// =============================
// 🔍 Buscar servicios
// =============================
app.get("/api/servicios", async (req, res) => {
  const { categoria = "", ubicacion = "", q = "", usuarioId = "", servicioId = "" } = req.query;

  try {
    let where = {};

    if (usuarioId) {
      where.usuarioId = Number(usuarioId);
    } else if (servicioId) {
      const servicio = await prisma.servicio.findUnique({
        where: { id: Number(servicioId) },
      });
      if (!servicio) {
        return res.status(404).json({ error: "Servicio no encontrado" });
      }
      where.usuarioId = servicio.usuarioId;
    }

    if (categoria) where.categoria = categoria;
    if (ubicacion) where.ubicacion = ubicacion;
    if (q) {
      where.OR = [
        { titulo: { contains: q } },
        { comentario: { contains: q } },
      ];
    }

    const servicios = await prisma.servicio.findMany({
      where,
      include: { usuario: true },
      orderBy: { createdAt: "desc" },
    });

    res.json(servicios);
  } catch (err) {
    console.error("❌ Error en findMany:", err);
    res.status(500).json({ error: "Error en la base de datos" });
  }
});

// =============================
// 📋 Obtener servicios del usuario autenticado
// =============================
app.get("/api/servicios/mios", verificarToken, async (req, res) => {
  try {
    const usuarioId = Number(req.user.id);
    const servicios = await prisma.servicio.findMany({
      where: { usuarioId },
      orderBy: { id: "desc" },
    });
    res.json(servicios);
  } catch (err) {
    console.error("❌ Error al obtener servicios:", err);
    res.status(500).json({ error: "Error al obtener servicios" });
  }
});

// 🧑‍🔧 Obtener un servicio por ID
app.get("/api/servicios/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!id || isNaN(id)) return res.status(400).json({ error: "ID inválido" });

  try {
    const servicio = await prisma.servicio.findUnique({
      where: { id },
      include: {
        usuario: true,
        items: true,
        resenas: true // 👈 corregido: SIN ñ
      },
    });

    if (!servicio)
      return res.status(404).json({ error: "Servicio no encontrado" });

    res.json(servicio);
  } catch (err) {
    console.error("❌ Error al obtener servicio:", err);
    res.status(500).json({ error: "Error interno en el servidor" });
  }
});


// =============================
// ✏️ Crear servicio
// =============================
app.post("/api/servicios", verificarToken, async (req, res) => {
  const { titulo, categoria, ubicacion, comentario, imagen, email, descripcion, items } = req.body;

  if (!titulo || !categoria || !ubicacion || !comentario)
    return res.status(400).json({ error: "Campos obligatorios: titulo, categoria, ubicacion y comentario" });

  try {
    const creado = await prisma.servicio.create({
      data: {
        titulo,
        categoria,
        ubicacion,
        comentario,
        descripcion: descripcion || "",
        imagen: imagen || imagenPorCategoria[categoria] || "/assets/placeholder.jpg",
        email: email || req.user.email,
        rating: 4.0,
        usuarioId: Number(req.user.id),
        items: Array.isArray(items)
          ? { create: items.map((nombre) => ({ nombre })) }
          : undefined,
      },
    });

    res.status(201).json({ message: "✅ Servicio creado correctamente", servicio: creado });
  } catch (err) {
    console.error("❌ Error al crear servicio:", err);
    res.status(500).json({ error: "No se pudo crear el servicio" });
  }
});

// =============================
// ✏️ Editar servicio por ID
// =============================
app.put("/api/servicios/:id", verificarToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { titulo, categoria, ubicacion, comentario } = req.body;

    if (!titulo || !categoria || !ubicacion || !comentario) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    const servicio = await prisma.servicio.findUnique({ where: { id } });
    if (!servicio) return res.status(404).json({ error: "Servicio no encontrado" });

    // ✅ Validar que el servicio pertenece al usuario
    if (servicio.usuarioId !== req.user.id && req.user.rol !== "ADMIN") {
      return res.status(403).json({ error: "No tienes permiso para editar este servicio" });
    }

    const actualizado = await prisma.servicio.update({
      where: { id },
      data: { titulo, categoria, ubicacion, comentario },
    });

    res.json({ message: "✅ Servicio actualizado correctamente", servicio: actualizado });
  } catch (error) {
    console.error("❌ Error al editar servicio:", error);
    res.status(500).json({ error: "Error al editar el servicio" });
  }
});

// =============================
// 🗑️ Eliminar servicio por ID
// =============================
app.delete("/api/servicios/:id", verificarToken, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const servicio = await prisma.servicio.findUnique({ where: { id } });
    if (!servicio) return res.status(404).json({ error: "Servicio no encontrado" });

    // ✅ Validar que el servicio pertenece al usuario autenticado
    if (servicio.usuarioId !== req.user.id && req.user.rol !== "ADMIN") {
      return res.status(403).json({ error: "No tienes permiso para eliminar este servicio" });
    }

    await prisma.servicio.delete({ where: { id } });

    res.json({ message: "🗑️ Servicio eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar servicio:", error);
    res.status(500).json({ error: "Error al eliminar el servicio" });
  }
});


// =============================
// 🗓️ TURNOS
// =============================
app.post("/api/turnos", async (req, res) => {
  const { nombre, email, fecha, detalle, servicioId } = req.body;

  if (!nombre || !email)
    return res.status(400).json({ error: "Campos obligatorios: nombre y email." });

  if (!servicioId)
    return res.status(400).json({ error: "Falta el ID del servicio asociado." });

  try {
    const servicio = await prisma.servicio.findUnique({
      where: { id: Number(servicioId) },
      include: { usuario: true },
    });

    if (!servicio)
      return res.status(404).json({ error: "Servicio no encontrado." });

    const turno = await prisma.turno.create({
      data: {
        nombre,
        email,
        detalle: detalle || "",
        fecha: fecha ? new Date(fecha) : null,
        servicioId: Number(servicioId),
      },
    });

    console.log(`📅 Nuevo turno creado para servicio #${servicioId} (${servicio.titulo})`);

    res.status(201).json({
      message: "✅ Turno creado correctamente",
      turno,
    });
  } catch (err) {
    console.error("❌ Error al crear turno:", err);
    res.status(500).json({ error: "No se pudo crear el turno." });
  }
});

// 📋 Obtener turnos del prestador logueado
app.get("/api/turnos/mios", verificarToken, async (req, res) => {
  try {
    const turnos = await prisma.turno.findMany({
      where: { servicio: { usuarioId: req.user.id } },
      include: {
        servicio: {
          select: { titulo: true, categoria: true, ubicacion: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const data = turnos.map((t) => ({
      id: t.id,
      nombre: t.nombre,
      email: t.email,
      detalle: t.detalle,
      fecha: t.fecha,
      estado: t.estado || "pendiente",
      servicio: t.servicio?.titulo || "Sin servicio",
      categoria: t.servicio?.categoria,
      ubicacion: t.servicio?.ubicacion,
    }));

    res.json(data);
  } catch (error) {
    console.error("❌ Error al obtener turnos del prestador:", error);
    res.status(500).json({ error: "Error al obtener los turnos" });
  }
});

// 🔄 Cambiar estado del turno
app.put("/api/turnos/:id/estado", verificarToken, async (req, res) => {
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

    res.json({ message: "✅ Estado actualizado correctamente", turno: actualizado });
  } catch (error) {
    console.error("❌ Error al actualizar estado:", error);
    res.status(500).json({ error: "Error al cambiar el estado del turno" });
  }
});

// =============================
// 🧾 RESEÑAS (ahora sin ñ → /api/resenas)
// =============================
app.get("/api/resenas/servicio/:id", async (req, res) => {
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

app.post("/api/resenas", async (req, res) => {
  try {
    const { nombre, email, comentario, puntaje, servicioId } = req.body;

    if (!nombre || !email || !comentario || !puntaje || !servicioId) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    const servicio = await prisma.servicio.findUnique({
      where: { id: Number(servicioId) },
    });
    if (!servicio) {
      return res.status(404).json({ error: "Servicio no encontrado" });
    }

    const nuevaResena = await prisma.resena.create({
      data: {
        nombre,
        email,
        comentario,
        puntaje: Number(puntaje),
        servicioId: Number(servicioId),
      },
    });

    const promedio = await prisma.resena.aggregate({
      where: { servicioId: Number(servicioId) },
      _avg: { puntaje: true },
    });

    await prisma.servicio.update({
      where: { id: Number(servicioId) },
      data: { rating: promedio._avg.puntaje || 0 },
    });

    res.status(201).json({
      message: "✅ Reseña enviada correctamente y rating actualizado",
      resena: nuevaResena,
      nuevoRating: promedio._avg.puntaje,
    });
  } catch (error) {
    console.error("❌ Error al crear reseña:", error);
    res.status(500).json({ error: "Error al crear la reseña" });
  }
});

app.get("/api/resenas/mias", verificarToken, async (req, res) => {
  try {
    const resenas = await prisma.resena.findMany({
      where: { servicio: { usuarioId: req.user.id } },
      include: {
        servicio: { select: { titulo: true, categoria: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(
      resenas.map((r) => ({
        id: r.id,
        servicio: r.servicio?.titulo || "Sin servicio",
        categoria: r.servicio?.categoria || "",
        nombre: r.nombre,
        email: r.email,
        comentario: r.comentario,
        puntaje: r.puntaje,
        fecha: r.createdAt,
      }))
    );
  } catch (error) {
    console.error("❌ Error al obtener reseñas del prestador:", error);
    res.status(500).json({ error: "Error al obtener reseñas" });
  }
});

// =============================
// 🚀 Servidor y frontend
// =============================
app.get("*", (req, res) => {
  // No interceptar rutas de la API
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Ruta API no encontrada" });
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Serv-list ejecutándose en http://localhost:${PORT}`);
});
