import nodemailer from "nodemailer";

interface EmailResult {
  success: boolean;
  error?: string;
}

function buildTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP credentials are missing");
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendEmail(options: { to: string; subject: string; html: string }) {
  const transporter = buildTransporter();
  await transporter.sendMail({
    from: `"Warungpedia" <${process.env.SMTP_USER}>`,
    ...options,
  });
}

export async function sendRejectionEmail(
  email: string,
  name: string,
  storeName: string,
  reason: string,
): Promise<EmailResult> {
  try {
    await sendEmail({
      to: email,
      subject: "Pendaftaran Penjual Ditolak - Warungpedia",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #0779FF; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">Warungpedia</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333;">Halo ${name},</h2>
            <p style="color: #555; line-height: 1.6;">
              Terima kasih telah mendaftar sebagai penjual di <strong>Warungpedia</strong>.
            </p>
            <p style="color: #555; line-height: 1.6;">
              Sayangnya, kami tidak dapat menerima pendaftaran <strong>${storeName}</strong> karena:
            </p>
            <blockquote style="background:#fff; padding:15px; border-left:4px solid #dc3545; margin: 20px 0; color: #555;">
              ${reason}
            </blockquote>
            <p style="color: #555; line-height: 1.6;">
              Silakan hubungi kami jika ada pertanyaan di 
              <a href="mailto:support@warungpedia.id" style="color: #0779FF;">support@warungpedia.id</a>
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              Email otomatis dari Warungpedia<br>
              © 2025 Warungpedia. All rights reserved.
            </p>
          </div>
        </div>
      `,
    });
    console.log(`✅ Rejection email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to send rejection email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function sendApprovalEmail(
  email: string,
  name: string,
  storeName: string,
  loginUrl: string,
): Promise<EmailResult> {
  try {
    await sendEmail({
      to: email,
      subject: "🎉 Selamat! Akun Penjual Anda Telah Diaktifkan - Warungpedia",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #0779FF; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">Warungpedia</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333;">🎉 Selamat, ${name}!</h2>
            <p style="color: #555; line-height: 1.6;">
              Kami dengan senang hati memberitahukan bahwa pendaftaran toko <strong>${storeName}</strong> 
              telah <strong style="color: #0779FF;">DISETUJUI</strong> dan akun Anda telah diaktifkan!
            </p>
            
            <div style="background: #e8f4ff; border-left: 4px solid #0779FF; padding: 15px; margin: 20px 0;">
              <p style="color: #333; margin: 0; font-weight: bold;">
                ✓ Status: <span style="color: #0779FF;">AKTIF</span>
              </p>
            </div>

            <p style="margin: 30px 0; text-align: center;">
              <a
                href="${loginUrl}"
                style="display: inline-block; padding: 14px 32px; background: #0779FF; color: #fff; text-decoration: none; border-radius: 999px; font-weight: bold;"
              >
                Masuk ke Dashboard Penjual
              </a>
            </p>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

            <p style="color: #555; line-height: 1.6;">
              Butuh bantuan? Hubungi kami di 
              <a href="mailto:support@warungpedia.id" style="color: #0779FF;">support@warungpedia.id</a>
            </p>

            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
              Email otomatis dari Warungpedia<br>
              © 2025 Warungpedia. All rights reserved.
            </p>
          </div>
        </div>
      `,
    });
    console.log(`✅ Approval email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to send approval email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

type FeedbackThanksPayload = {
  email: string;
  name: string;
  province?: string;
  productName?: string;
};

export async function sendFeedbackThankYouEmail(
  payload: FeedbackThanksPayload,
): Promise<EmailResult> {
  try {
    await sendEmail({
      to: payload.email,
      subject: "Terima kasih atas ulasan Anda - Warungpedia",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #0779FF; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">Warungpedia</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333;">Terima kasih, ${payload.name}!</h2>
            <p style="color: #555; line-height: 1.6;">
              Kami telah menerima ulasan dan rating Anda${
                payload.productName ? ` untuk produk <strong>${payload.productName}</strong>` : ""
              }.
            </p>
            <p style="color: #555; line-height: 1.6;">
              Tim kami sangat mengapresiasi waktu yang Anda luangkan. Masukan Anda membantu penjual Warungpedia terus meningkatkan kualitas layanan.
            </p>
            ${payload.province ? `<p style="color:#555;">Salam hangat untuk Anda di <strong>${payload.province}</strong>.</p>` : ""}
            <p style="color: #555;">Jika ada hal lain yang ingin dibagikan, cukup balas email ini ya!</p>
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
              Email otomatis dari Warungpedia<br />© 2025 Warungpedia. All rights reserved.
            </p>
          </div>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to send thank you email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
