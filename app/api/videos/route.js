import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

async function getOrCreateUser(clerkUserId) {
  let user = await prisma.user.findUnique({ where: { clerkUserId:clerkUserId } });

  if (!user) {
    const clerkUser = await (await clerkClient()).users.getUser(clerkUserId);
    user = await prisma.user.create({
      data: {
        clerkUserId,
        email: clerkUser.emailAddresses[0].emailAddress,
        plan: "free",
        uploadsThisMonth: 0,
        uploadLimit: 10,
      },
    });
  }

  return user;
}

export async function GET(request) {
  try {
    const { userId } =await auth();
    console.log("user Id here:",userId)
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("Fetching videos for userId:", userId);

    // ✅ ensure user exists in Neon
    const user = await getOrCreateUser(userId);
    console.log("user details: ",user )
    // ✅ fetch videos for this user only
    const videos = await prisma.video.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    console.log(`Fetched ${videos.length} videos for userId ${userId}`);

    return NextResponse.json({ user, videos });
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
