-- CreateTable
CREATE TABLE "Servicio" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "titulo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "comentario" TEXT NOT NULL,
    "imagen" TEXT NOT NULL,
    "email" TEXT,
    "descripcion" TEXT,
    "rating" REAL DEFAULT 4.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ServicioItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "servicioId" INTEGER NOT NULL,
    CONSTRAINT "ServicioItem_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Turno" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "servicioId" INTEGER,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fecha" DATETIME,
    "detalle" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Servicio_categoria_idx" ON "Servicio"("categoria");

-- CreateIndex
CREATE INDEX "Servicio_ubicacion_idx" ON "Servicio"("ubicacion");
