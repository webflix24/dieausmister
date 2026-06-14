-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "driveFolder" TEXT;
ALTER TABLE "Customer" ADD COLUMN "hubspotId" TEXT;

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN "bunqPaymentId" TEXT;
ALTER TABLE "Quote" ADD COLUMN "lexofficeId" TEXT;
ALTER TABLE "Quote" ADD COLUMN "paidAt" DATETIME;

-- CreateTable
CREATE TABLE "CustomerObject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "address" TEXT,
    "floor" INTEGER,
    "hasElevator" BOOLEAN NOT NULL DEFAULT false,
    "squareMeters" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CustomerObject_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CallHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'INBOUND',
    "duration" INTEGER,
    "callId" TEXT,
    "aiSummary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CallHistory_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tour" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "customerId" TEXT,
    "objectId" TEXT,
    "address" TEXT,
    "city" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "driveFolderBefore" TEXT,
    "driveFolderAfter" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Tour_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Tour_objectId_fkey" FOREIGN KEY ("objectId") REFERENCES "CustomerObject" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Tour" ("address", "city", "createdAt", "customerId", "date", "endTime", "id", "notes", "startTime", "status", "title", "updatedAt") SELECT "address", "city", "createdAt", "customerId", "date", "endTime", "id", "notes", "startTime", "status", "title", "updatedAt" FROM "Tour";
DROP TABLE "Tour";
ALTER TABLE "new_Tour" RENAME TO "Tour";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CallHistory_callId_key" ON "CallHistory"("callId");
