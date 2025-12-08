import { NextRequest, NextResponse } from "next/server";
import {
  createProductFeedback,
  listProductFeedbacks,
} from "@/lib/controllers/productFeedbackController";
import { validateProductFeedback } from "@/lib/utils/productFeedbackValidator";
import { sendFeedbackThankYouEmail } from "@/lib/services/emailService";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const feedbacks = await listProductFeedbacks(id);
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
    const { id } = await context.params;
    const body = await req.json();
    const payload = {
      productId: id,
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

    // kirim email ucapan terima kasih (non-blocking error)
    try {
      await sendFeedbackThankYouEmail({
        email: created.email,
        name: created.customer_name,
        province: created.province,
      });
    } catch (emailError) {
      console.warn("Gagal mengirim email ucapan", emailError);
    }

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Gagal menyimpan feedback", details: String(error) },
      { status: 500 },
    );
  }
}
