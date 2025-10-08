// routes/usuario.js
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const router = express.Router();
const prisma = new PrismaClient();

// ============================================================
// 🔒 Middleware de autenticación JWT
// ============================================================
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ error: "Falta token de autenticación" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "clave_secreta_dev");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Token inválido o expirado" });
  }
}

// ============================================================
// 🧩 Registro de usuario
// ============================================================
router.post("/register", async (req, res) => {
  try {
    const { nombre, apellido, email, password, confirmPassword } = req.body;

    if (!nombre || !apellido || !email || !password)
      return res.status(400).json({ error: "Todos los campos son obligatorios" });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: "Formato de email inválido" });

    if (confirmPassword && password !== confirmPassword)
      return res.status(400).json({ error: "Las contraseñas no coinciden" });

    const existente = await prisma.usuario.findUnique({ where: { email } });
    if (existente)
      return res.status(400).json({ error: "El correo ya está registrado" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        apellido,
        email,
        password: hashedPassword,
        rol: "PRESTADOR",
      },
    });

    const { password: _, ...safeUser } = usuario;
    res.status(201).json({ message: "Usuario registrado con éxito", usuario: safeUser });
  } catch (error) {
    console.error("❌ Error en /register:", error);
    res.status(500).json({ error: "Error interno en el servidor" });
  }
});

// ============================================================
// 🔐 Inicio de sesión
// ============================================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email y contraseña son requeridos" });

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario)
      return res.status(401).json({ error: "Usuario no encontrado" });

    const match = await bcrypt.compare(password, usuario.password);
    if (!match)
      return res.status(401).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol || "CLIENTE",
      },
      process.env.JWT_SECRET || "clave_secreta_dev",
      { expiresIn: "2h" }
    );

    // 🧠 Devolvemos toda la info visible, incluyendo imagen
    const safeUser = {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      rol: usuario.rol,
      telefono: usuario.telefono,
      localidad: usuario.localidad,
      imagen: usuario.imagen || null,
    };

    res.json({ message: "Inicio de sesión exitoso", token, usuario: safeUser });
  } catch (error) {
    console.error("❌ Error en /login:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// ============================================================
// 👤 Obtener perfil del usuario logueado
// ============================================================
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        rol: true,
        telefono: true,
        localidad: true,
        imagen: true, // 👈 incluimos la imagen
      },
    });

    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(usuario);
  } catch (error) {
    console.error("❌ Error en /me:", error);
    res.status(500).json({ error: "Error al obtener perfil del usuario" });
  }
});

// ============================================================
// ✏️ Actualizar datos del usuario (incluye imagen y localidad)
// ============================================================
router.put("/update", authMiddleware, async (req, res) => {
  try {
    const { id, nombre, email, telefono, localidad, imagen } = req.body;
    if (!id) return res.status(400).json({ error: "Falta el ID del usuario" });

    if (req.user.id !== Number(id))
      return res.status(403).json({ error: "No tienes permiso para editar este perfil" });

    const usuario = await prisma.usuario.update({
      where: { id: Number(id) },
      data: { nombre, email, telefono, localidad, imagen },
    });

    const { password, ...safeUser } = usuario;
    res.json({ message: "✅ Datos actualizados correctamente", usuario: safeUser });
  } catch (error) {
    console.error("❌ Error en /update:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// ============================================================
// 🔒 Cambiar contraseña real
// ============================================================
router.put("/cambiar-password", authMiddleware, async (req, res) => {
  try {
    const { id, passwordActual, nuevaPassword, confirmarPassword } = req.body;

    if (!id || !passwordActual || !nuevaPassword || !confirmarPassword)
      return res.status(400).json({ error: "Todos los campos son obligatorios" });

    if (req.user.id !== Number(id))
      return res.status(403).json({ error: "No tienes permiso para cambiar esta contraseña" });

    const usuario = await prisma.usuario.findUnique({ where: { id: Number(id) } });
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

    const coincide = await bcrypt.compare(passwordActual, usuario.password);
    if (!coincide)
      return res.status(401).json({ error: "La contraseña actual es incorrecta" });

    const regexCompleja = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!regexCompleja.test(nuevaPassword))
      return res.status(400).json({
        error: "La nueva contraseña debe tener al menos 6 caracteres, una mayúscula, una minúscula y un número.",
      });

    if (nuevaPassword !== confirmarPassword)
      return res.status(400).json({ error: "Las contraseñas nuevas no coinciden" });

    const hashed = await bcrypt.hash(nuevaPassword, 10);
    await prisma.usuario.update({
      where: { id: Number(id) },
      data: { password: hashed },
    });

    res.json({ message: "✅ Contraseña actualizada correctamente." });
  } catch (error) {
    console.error("❌ Error al cambiar contraseña:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
