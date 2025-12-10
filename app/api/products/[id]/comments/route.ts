import { NextRequest, NextResponse } from "next/server";
import {
  createProductFeedback,
  listProductFeedbacks,
} from "@/lib/controllers/productFeedbackController";
import { validateProductFeedback } from "@/lib/utils/productFeedbackValidator";
import { sendThankYouEmail } from "@/lib/services/emailService";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: productId } = await context.params;
    const feedbacks = await listProductFeedbacks(productId);
    return NextResponse.json({ data: feedbacks });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal memuat feedback", details: String(error) },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: productId } = await context.params;
    const body = await req.json();

    const payload = {
      productId,
      name: String(body.name ?? "").trim(),
      phone: String(body.phone ?? "").trim(),
      email: String(body.email ?? "").trim().toLowerCase(),
      province: String(body.province ?? "").trim(),
      comment: String(body.comment ?? "").trim(),
      rating: Number(body.rating ?? 0),
    };

    const validation = validateProductFeedback(payload);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Validasi gagal", fields: validation.errors },
        { status: 422 },
      );
    }

    const created = await createProductFeedback(payload);

    const emailResult = await sendThankYouEmail({
      email: payload.email,
      name: payload.name,
      rating: payload.rating,
      comment: payload.comment,
    });

    if (!emailResult.success) {
      console.error("⚠️ Thank-you email failed:", emailResult.error);
    }

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal menyimpan feedback", details: String(error) },
      { status: 500 },
    );
  }
}
