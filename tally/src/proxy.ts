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

  const { pathname } = req.nextUrl;

  const appHome = new URL("/", req.url);
  const loginUrl = new URL("/pages/login", req.url);

  const isApiRoute = pathname.startsWith("/api") || pathname.startsWith("/trpc");

  // If user is logged in and they hit auth pages, send them home
  if (isAuthPage(req)) {
    if (userId) return NextResponse.redirect(appHome);
    return NextResponse.next();
  }

  // If not logged in:
  if (!userId) {
    if (isApiRoute) {
      return NextResponse.json(
        { code: "UNAUTHORIZED", message: "Not signed in" },
        { status: 401 }
      );
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});
export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};