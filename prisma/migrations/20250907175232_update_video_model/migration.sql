/*
  Warnings:

  - Made the column `captionsUrl` on table `Video` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Video" ALTER COLUMN "captionsUrl" SET NOT NULL;
