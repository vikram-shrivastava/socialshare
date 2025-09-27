import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
    "/sign-in",
    "/sign-up",
])
const isPublicApiRoute = createRouteMatcher([
    "/api/videos"
])


export default clerkMiddleware (async(auth, req) => {
     const { userId } =await auth(); 
    console.log(userId)
    const currentUrl = new URL(req.url)
     const isAccessingDashboard = currentUrl.pathname === "/"
     const isApiRequest = currentUrl.pathname.startsWith("/api")

     // If user is logged in and accessing a public route but not the dashboard
    if(userId && isPublicRoute(req) && !isAccessingDashboard) {
        console.log("redirecting to /home");
        return NextResponse.redirect(new URL("/home", req.url))
    }
    if(userId && req.nextUrl.pathname === "/"){
        return NextResponse.redirect(new URL("/home", req.url))
    }
    //not logged in
    if(!userId){
        // If user is not logged in and trying to access a protected route
        if(!isPublicRoute(req) && !isPublicApiRoute(req) ){
            return NextResponse.redirect(new URL("/sign-in", req.url))
        }

        // If the request is for a protected API and the user is not logged in
        if(isApiRequest && !isPublicApiRoute(req)){
            return NextResponse.redirect(new URL("/sign-in", req.url))
        }
    }
    return NextResponse.next()

})

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};