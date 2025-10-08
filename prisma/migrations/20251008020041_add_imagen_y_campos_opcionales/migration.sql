/*
  Warnings:

  - Made the column `usuarioId` on table `Servicio` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Servicio" (
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
    "updatedAt" DATETIME NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    CONSTRAINT "Servicio_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Servicio" ("categoria", "comentario", "createdAt", "descripcion", "email", "id", "imagen", "rating", "titulo", "ubicacion", "updatedAt", "usuarioId") SELECT "categoria", "comentario", "createdAt", "descripcion", "email", "id", "imagen", "rating", "titulo", "ubicacion", "updatedAt", "usuarioId" FROM "Servicio";
DROP TABLE "Servicio";
ALTER TABLE "new_Servicio" RENAME TO "Servicio";
CREATE INDEX "Servicio_categoria_idx" ON "Servicio"("categoria");
CREATE INDEX "Servicio_ubicacion_idx" ON "Servicio"("ubicacion");
CREATE TABLE "new_Turno" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "servicioId" INTEGER,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fecha" DATETIME,
    "detalle" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Turno_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Turno" ("createdAt", "detalle", "email", "fecha", "id", "nombre", "servicioId") SELECT "createdAt", "detalle", "email", "fecha", "id", "nombre", "servicioId" FROM "Turno";
DROP TABLE "Turno";
ALTER TABLE "new_Turno" RENAME TO "Turno";
CREATE TABLE "new_Usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "calle" TEXT,
    "numero" TEXT,
    "localidad" TEXT,
    "imagen" TEXT,
    "password" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Usuario" ("apellido", "calle", "createdAt", "email", "id", "localidad", "nombre", "numero", "password", "rol", "telefono", "updatedAt") SELECT "apellido", "calle", "createdAt", "email", "id", "localidad", "nombre", "numero", "password", "rol", "telefono", "updatedAt" FROM "Usuario";
DROP TABLE "Usuario";
ALTER TABLE "new_Usuario" RENAME TO "Usuario";
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
