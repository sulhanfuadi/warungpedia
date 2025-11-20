import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // ✅ Skip middleware untuk route login
  if (path === "/login" || path === "/penjual/register") {
    console.log("⏭️ Skipping middleware for:", path);
    return NextResponse.next();
  }

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

  console.log("🔐 Middleware triggered for:", path);
  console.log("Session exists:", !!session);

  // === ADMIN ROUTES ===
  if (path.startsWith("/admin")) {
    console.log("🎯 Checking admin route access");

    if (!session) {
      console.log("❌ No session, redirecting to /login");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // ✅ Check role di tabel sellers
    const { data: seller, error: sellerError } = await supabase
      .from("sellers")
      .select("role")
      .eq("id", session.user.id)
      .single();

    console.log("Seller Data in Middleware:", seller);
    console.log("Seller Error in Middleware:", sellerError);

    if (sellerError || !seller || seller.role !== "admin") {
      console.log("❌ Not admin or error, redirecting to /login");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    console.log("✅ Admin access granted");
  }

  // === SELLER ROUTES ===
  if (
    path.startsWith("/penjual/dashboard") ||
    path.startsWith("/penjual/produk")
  ) {
    console.log("🎯 Checking seller route access");

    if (!session) {
      console.log("❌ No session, redirecting to /login");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const { data: seller, error: sellerError } = await supabase
      .from("sellers")
      .select("role, status")
      .eq("id", session.user.id)
      .single();

    console.log("Seller Data in Middleware:", seller);
    console.log("Seller Error in Middleware:", sellerError);

    if (sellerError || !seller || seller.role !== "seller") {
      console.log("❌ Not seller or error, redirecting to /login");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (seller.status !== "ACTIVE") {
      console.log("❌ Seller not active, redirecting to /login");
      return NextResponse.redirect(
        new URL("/login?error=inactive", request.url)
      );
    }

    console.log("✅ Seller access granted");
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
