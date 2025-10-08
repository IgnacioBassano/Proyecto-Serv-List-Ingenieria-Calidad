/*
  Warnings:

  - You are about to drop the `Reseña` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Reseña";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Resena" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "servicioId" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "comentario" TEXT NOT NULL,
    "puntaje" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Resena_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
