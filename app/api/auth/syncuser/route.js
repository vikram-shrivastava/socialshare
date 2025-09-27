import { currentUser } from "@clerk/nextjs/server";
import db from "@/lib/db"; // your DB instance

export async function GET(req) {
  const user = await currentUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
  }

  const existing = await db.user.findUnique({
    where: { clerkId: user.id },
  });

  if (!existing) {
    await db.user.create({
      data: {
        clerkId: user.id,
        email: user.emailAddresses[0].emailAddress,
        name: `${user.firstName || ""} ${user.lastName || ""}`,
        imageUrl: user.imageUrl,
      },
    });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
