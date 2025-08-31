import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher(["/signin", "/signup", "/", "/home"]);
const isPublicApiRoute = createRouteMatcher(["/api/videos"]);

export default clerkMiddleware((auth, req) => {
  const { userId } = auth();
  const currentUrl = new URL(req.url);

  const isAccessingDashboard =
    currentUrl.pathname === "/home" || currentUrl.pathname === "/";
  const isApiUrl = currentUrl.pathname.startsWith("/api/");

  if (!userId && !isPublicRoute(req) && !isPublicApiRoute(req)) {
    return Response.redirect(new URL("/signin", req.url));
  }

  if (userId && isPublicRoute(req) && !isAccessingDashboard) {
    return Response.redirect(new URL("/home", req.url));
  }

  if (!userId && isApiUrl && !isPublicApiRoute(req)) {
    return Response.redirect(new URL("/signin", req.url));
  }

  return Response.next;
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
