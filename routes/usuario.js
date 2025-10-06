// routes/usuario.js
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const router = express.Router();
const prisma = new PrismaClient();

router.post("/register", async (req, res) => {
  try {
    const { nombre, apellido, email, telefono, calle, numero, localidad, password } = req.body;

    if (!nombre || !apellido || !email || !telefono || !calle || !numero || !localidad || !password) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    const existing = await prisma.usuario.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "El correo ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        apellido,
        email,
        telefono,
        calle,
        numero,
        localidad,
        password: hashedPassword,
      },
    });

    res.status(201).json({ message: "Usuario registrado con éxito", usuario });
  } catch (error) {
    console.error("❌ Error en /register:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});


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
      { id: usuario.id, email: usuario.email, nombre: usuario.nombre },
      process.env.JWT_SECRET || "clave_secreta_dev",
      { expiresIn: "2h" }
    );

    res.json({ message: "Inicio de sesión exitoso", token });
  } catch (error) {
    console.error("❌ Error en /login:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

router.put("/update", async (req, res) => {
  try {
    const { id, nombre, email, telefono } = req.body;

    if (!id) return res.status(400).json({ error: "Falta el ID del usuario" });

    const usuario = await prisma.usuario.update({
      where: { id: Number(id) },
      data: {
        nombre,
        email,
        telefono,
      },
    });

    res.json({ message: "Datos actualizados correctamente", usuario });
  } catch (error) {
    console.error("❌ Error en /update:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

module.exports = router;