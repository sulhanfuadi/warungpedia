import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  // Allow sellerId to be passed via cookie or query for product uploads (no auth enforcement).
  if (req.nextUrl.pathname.startsWith("/api/penjual/products")) {
    const sellerFromCookie = req.cookies.get("sellerId")?.value;
    const sellerFromQuery = req.nextUrl.searchParams.get("sellerId");
    const sellerId = sellerFromCookie || sellerFromQuery;

    if (sellerId) {
      const headers = new Headers(req.headers);
      headers.set("x-seller-id", sellerId);
      return NextResponse.next({ request: { headers } });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/penjual/products/:path*"],
};
