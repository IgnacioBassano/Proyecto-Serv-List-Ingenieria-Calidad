-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Turno" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "servicioId" INTEGER,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fecha" DATETIME,
    "detalle" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Turno_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Turno" ("createdAt", "detalle", "email", "fecha", "id", "nombre", "servicioId") SELECT "createdAt", "detalle", "email", "fecha", "id", "nombre", "servicioId" FROM "Turno";
DROP TABLE "Turno";
ALTER TABLE "new_Turno" RENAME TO "Turno";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
