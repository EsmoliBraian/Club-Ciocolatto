import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const CUSTOMER_ROUTES = ["/inicio", "/misiones", "/qr", "/canjear", "/perfil"];

/**
 * Coarse, cookie-only gate (no DB access): redirects unauthenticated/
 * wrong-role visitors away from a route group. Every Server Action and
 * Server Component still re-checks `auth()` + role itself — Proxy alone is
 * not treated as the authorization boundary (Next.js's own guidance).
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isAdminRoute = pathname.startsWith("/admin");
  const isEmployeeRoute = pathname.startsWith("/empleado");
  const isCustomerRoute = CUSTOMER_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!isAdminRoute && !isEmployeeRoute && !isCustomerRoute) {
    return NextResponse.next();
  }

  if (!session?.user) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { role } = session.user;

  if (isAdminRoute && role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }
  if (isEmployeeRoute && !["EMPLOYEE", "ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }
  if (isCustomerRoute && role !== "CUSTOMER") {
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.webmanifest|sw.js).*)",
  ],
};
