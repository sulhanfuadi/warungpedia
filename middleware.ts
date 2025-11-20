import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // Get session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const path = request.nextUrl.pathname;

  // === ADMIN ROUTES ===
  if (path.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url)); // ✅ Ganti jadi /login
    }

    const { data: seller } = await supabase
      .from("sellers")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!seller || seller.role !== "admin") {
      return NextResponse.redirect(new URL("/login", request.url)); // ✅ Ganti jadi /login
    }
  }

  // === SELLER ROUTES ===
  if (
    path.startsWith("/penjual/dashboard") ||
    path.startsWith("/penjual/produk")
  ) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url)); // ✅ Ganti jadi /login
    }

    const { data: seller } = await supabase
      .from("sellers")
      .select("role, status")
      .eq("id", session.user.id)
      .single();

    if (!seller || seller.role !== "seller") {
      return NextResponse.redirect(new URL("/login", request.url)); // ✅ Ganti jadi /login
    }

    if (seller.status !== "ACTIVE") {
      return NextResponse.redirect(
        new URL("/login?error=inactive", request.url)
      );
    }
  }

  // === API ROUTES ===
  if (path.startsWith("/api/admin")) {
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: seller } = await supabase
      .from("sellers")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!seller || seller.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/penjual/dashboard/:path*",
    "/penjual/produk/:path*",
    "/api/admin/:path*",
  ],
};
