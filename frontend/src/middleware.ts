import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** So shared caches (CDN) do not serve one HTML language to all users — must vary on locale cookie. */
export function middleware(_request: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("Vary", "Cookie");
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
