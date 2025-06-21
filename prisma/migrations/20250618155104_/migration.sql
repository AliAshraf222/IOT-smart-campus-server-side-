-- CreateTable
CREATE TABLE "TrashCan" (
    "id" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "lastEmptied" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrashCan_pkey" PRIMARY KEY ("id")
);
