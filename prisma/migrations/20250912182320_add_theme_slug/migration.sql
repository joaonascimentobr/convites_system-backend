/*
  Warnings:

  - Added the required column `slug` to the `Theme` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Theme" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bgUrl" TEXT,
    "musicUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Theme" ("bgUrl", "createdAt", "id", "musicUrl", "name", "updatedAt") SELECT "bgUrl", "createdAt", "id", "musicUrl", "name", "updatedAt" FROM "Theme";
DROP TABLE "Theme";
ALTER TABLE "new_Theme" RENAME TO "Theme";
CREATE UNIQUE INDEX "Theme_slug_key" ON "Theme"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
