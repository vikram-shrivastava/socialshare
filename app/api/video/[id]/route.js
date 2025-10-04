import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

const prisma = new PrismaClient();

async function getOrCreateUser(clerkUserId) {
  let user = await prisma.user.findUnique({ where: { clerkUserId } });
  if (!user) {
    const clerkUser = await clerkClient().users.getUser(clerkUserId);
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

export async function GET(request, { params }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const videoId = params.id;
    console.log("Video ID from params:", videoId);

    const user = await getOrCreateUser(userId);
    console.log("User details:", user);

    const video = await prisma.video.findFirst({
      where: { id: videoId, userId: user.id }, // or user.clerkUserId if that's stored in video
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    console.log("Fetched video:", video);

    return NextResponse.json({ user, video });
  } catch (error) {
    console.error("Error fetching video:", error);
    return NextResponse.json({ error: "Failed to fetch video", details: error }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
