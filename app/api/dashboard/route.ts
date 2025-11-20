import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Dashboard API OK",
    total_users: 30,
    total_products: 120
  });
}
