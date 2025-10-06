-- CreateTable
CREATE TABLE "Usuario" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "calle" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "localidad" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

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
    "usuarioId" INTEGER,
    CONSTRAINT "Servicio_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Servicio" ("categoria", "comentario", "createdAt", "descripcion", "email", "id", "imagen", "rating", "titulo", "ubicacion", "updatedAt") SELECT "categoria", "comentario", "createdAt", "descripcion", "email", "id", "imagen", "rating", "titulo", "ubicacion", "updatedAt" FROM "Servicio";
DROP TABLE "Servicio";
ALTER TABLE "new_Servicio" RENAME TO "Servicio";
CREATE INDEX "Servicio_categoria_idx" ON "Servicio"("categoria");
CREATE INDEX "Servicio_ubicacion_idx" ON "Servicio"("ubicacion");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");
