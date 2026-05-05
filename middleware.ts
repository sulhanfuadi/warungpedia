import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api/penjual/products")) {
    const authHeader = req.headers.get("authorization");
    // Block early when tidak ada token Bearer, agar upload produk hanya via seller login.
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized: login sebagai seller diperlukan" }),
        {
          status: 401,
          headers: { "content-type": "application/json" },
        },
      );
    }

    // Tetap oper sellerId dari cookie/query untuk kompatibilitas, meski server akan verifikasi token.
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
