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
  if (path.startsWith("/admin") && path !== "/admin/login") {
    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    // Check if user is admin
    const { data: adminData } = await supabase
      .from("admins")
      .select("id")
      .eq("id", session.user.id)
      .single();

    if (!adminData) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // === SELLER ROUTES ===
  if (
    path.startsWith("/penjual/dashboard") ||
    path.startsWith("/penjual/produk")
  ) {
    if (!session) {
      return NextResponse.redirect(new URL("/penjual/login", request.url));
    }

    // Check if user is seller
    const { data: sellerData } = await supabase
      .from("sellers")
      .select("id, status")
      .eq("id", session.user.id)
      .single();

    if (!sellerData) {
      return NextResponse.redirect(new URL("/penjual/login", request.url));
    }

    if (sellerData.status !== "ACTIVE") {
      return NextResponse.redirect(
        new URL("/penjual/login?error=inactive", request.url)
      );
    }
  }

  // === API ROUTES ===
  if (path.startsWith("/api/admin")) {
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: adminData } = await supabase
      .from("admins")
      .select("id")
      .eq("id", session.user.id)
      .single();

    if (!adminData) {
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
