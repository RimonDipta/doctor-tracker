import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic check only: it keeps signed-out visitors away from the app shell.
 * The session itself is validated by the app layout and by every API request.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has("dt_session")) return NextResponse.next();

  const url = new URL("/login", request.url);
  const destination = request.nextUrl.pathname + request.nextUrl.search;
  if (destination !== "/") url.searchParams.set("next", destination);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|login|icon\\.svg|favicon\\.ico).*)"],
};
