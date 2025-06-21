/*
  Warnings:

  - A unique constraint covering the columns `[licenseplate]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "User_licenseplate_key" ON "User"("licenseplate");
