-- DropForeignKey
ALTER TABLE "public"."Video" DROP CONSTRAINT "Video_userId_fkey";

-- AddForeignKey
ALTER TABLE "public"."Video" ADD CONSTRAINT "Video_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
