import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { INTRO_ELIGIBLE_HEADER, isIntroHiddenPath } from "@/lib/intro-entry";

/** So shared caches (CDN) do not serve one HTML language to all users — must vary on locale cookie. */
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const introEligible = !isIntroHiddenPath(path);

  const res = NextResponse.next();
  res.headers.set("Vary", "Cookie");
  res.headers.set(INTRO_ELIGIBLE_HEADER, introEligible ? "1" : "0");
  return res;
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets and images.
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
