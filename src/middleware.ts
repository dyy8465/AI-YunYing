import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  if (!req.auth) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return Response.redirect(url);
  }
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/stores/:path*",
    "/products/:path*",
    "/orders/:path*",
    "/inventory/:path*",
    "/advertising/:path*",
    "/finance/:path*",
    "/ai-assistant/:path*",
    "/users/:path*",
  ],
};
