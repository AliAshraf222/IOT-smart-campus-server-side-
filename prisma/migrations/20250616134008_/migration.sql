/*
  Warnings:

  - You are about to drop the column `hallId` on the `Camera` table. All the data in the column will be lost.
  - Added the required column `hallname` to the `Camera` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Camera" DROP CONSTRAINT "Camera_hallId_fkey";

-- AlterTable
ALTER TABLE "Camera" DROP COLUMN "hallId",
ADD COLUMN     "hallname" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Camera" ADD CONSTRAINT "Camera_hallname_fkey" FOREIGN KEY ("hallname") REFERENCES "Hall"("name") ON DELETE CASCADE ON UPDATE CASCADE;
