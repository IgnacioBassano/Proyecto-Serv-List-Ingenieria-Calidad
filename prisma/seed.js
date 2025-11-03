// prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.servicioItem.deleteMany();
  await prisma.turno.deleteMany();
  await prisma.servicio.deleteMany();

  const imagenPorCategoria = {
    Electricista: "/assets/marioelectricista.png",
    Plomería: "/assets/plomero.png",
    Carpintería: "/assets/carpintero.png",
    Limpieza: "/assets/limpieza.png",
  };

  await prisma.servicio.create({
    data: {
      titulo: "Mario López",
      categoria: "Electricista",
      ubicacion: "Córdoba",
      comentario: "Instalaciones seguras y mantenimiento preventivo.",
      imagen: imagenPorCategoria["Electricista"],
      email: "mario.lopez@servlist.com",
      descripcion:
        "Electricista matriculado con más de 8 años de experiencia en instalaciones domiciliarias y comerciales. Trabajo prolijo, cumplimiento de normas de seguridad y asesoramiento personalizado.",
      rating: 4.8,
      items: {
        create: [
          { nombre: "Tableros: térmicas y disyuntores" },
          { nombre: "Cableado y recableado" },
          { nombre: "Iluminación LED" },
        ],
      },
    },
  });

  await prisma.servicio.create({
    data: {
      titulo: "Jorge Ríos",
      categoria: "Plomería",
      ubicacion: "Mendoza",
      comentario: "Reparaciones rápidas y soluciones definitivas.",
      imagen: imagenPorCategoria["Plomería"],
      email: "jorge.rios@servlist.com",
      descripcion:
        "Plomero matriculado con 12 años de trayectoria. Especialista en instalaciones de agua y gas, destapaciones sin rotura y recambio de artefactos. Atención en hogares y comercios.",
      rating: 4.7,
      items: {
        create: [
          { nombre: "Destapaciones sin rotura" },
          { nombre: "Reparación de fugas y pérdidas" },
          { nombre: "Instalación de calefones y termotanques" },
        ],
      },
    },
  });

  await prisma.servicio.create({
    data: {
      titulo: "Carlos Pérez",
      categoria: "Carpintería",
      ubicacion: "Buenos Aires",
      comentario: "Diseño y fabricación de muebles a medida.",
      imagen: imagenPorCategoria["Carpintería"],
      email: "carlos.perez@servlist.com",
      descripcion:
        "Carpintero con taller propio y más de 6 años de experiencia. Realización de muebles a medida, reparaciones finas y restauración de piezas. Materiales de primera calidad y terminaciones profesionales.",
      rating: 4.6,
      items: {
        create: [
          { nombre: "Placares e interiores" },
          { nombre: "Bajo mesadas y alacenas" },
          { nombre: "Puertas y marcos" },
        ],
      },
    },
  });

  await prisma.servicio.create({
    data: {
      titulo: "Ana Gómez",
      categoria: "Limpieza",
      ubicacion: "Rosario",
      comentario: "Limpieza integral para hogares y oficinas.",
      imagen: imagenPorCategoria["Limpieza"],
      email: "ana.gomez@servlist.com",
      descripcion:
        "Profesional de limpieza con experiencia en mantenimiento de casas, oficinas y espacios comerciales. Incluye insumos, puntualidad y protocolos de higiene para mayor tranquilidad.",
      rating: 4.5,
      items: {
        create: [
          { nombre: "Limpieza general de hogares" },
          { nombre: "Mantenimiento de oficinas" },
          { nombre: "Limpieza final de obra" },
        ],
      },
    },
  });

  console.log("🌱 Seed completado con perfiles profesionales");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

