// middleware.ts (or proxy.ts)
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAuthPage = createRouteMatcher([
  "/pages/login(.*)",
  "/pages/tcu-login(.*)",
  "/pages/signup",
  "/pages/tcu-signup(.*)",

  // include if you use Clerk-hosted routes too:
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  const appHome = new URL("/", req.url);        
  const loginUrl = new URL("/pages/login", req.url);  

  if (isAuthPage(req)) {
    if (userId) return NextResponse.redirect(appHome);
    return NextResponse.next();
  }

  if (!userId) return NextResponse.redirect(loginUrl);
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};