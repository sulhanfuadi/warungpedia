import nodemailer from "nodemailer";

interface EmailResult {
  success: boolean;
  error?: string;
}

type TransportConfig = {
  host?: string;
  port?: string | number;
  user?: string;
  pass?: string;
};

const FROM_ADDRESS = process.env.SMTP_USER ? `"Warungpedia" <${process.env.SMTP_USER}>` : "Warungpedia <no-reply@warungpedia.id>";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function createTransporter(config: TransportConfig = {}) {
  const host = config.host ?? process.env.SMTP_HOST;
  const port = Number(config.port ?? process.env.SMTP_PORT ?? 465);
  const user = config.user ?? process.env.SMTP_USER;
  const pass = config.pass ?? process.env.SMTP_PASS;

  return nodemailer.createTransport({
    host,
    port,
    secure: true,
    auth: {
      user,
      pass,
    },
  });
}

export async function sendRejectionEmail(
  email: string,
  name: string,
  storeName: string,
  reason: string
): Promise<EmailResult> {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: FROM_ADDRESS,
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
    };

    await transporter.sendMail(mailOptions);
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
  loginUrl: string
): Promise<EmailResult> {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: FROM_ADDRESS,
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

            <div style="text-align: center; margin: 30px 0;">
              <a
                href="${loginUrl}"
                style="display: inline-block; background: #0779FF; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;"
              >
                Masuk ke Dashboard Penjual
              </a>
            </div>

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
    };

    await transporter.sendMail(mailOptions);
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

type ThankYouEmailPayload = {
  email: string;
  name?: string;
  rating: number;
  comment: string;
};

export async function sendThankYouEmail({
  email,
  name,
  rating,
  comment,
}: ThankYouEmailPayload): Promise<EmailResult> {
  try {
    const transporter = createTransporter();
    const recipientName = name?.trim() || "Pengunjung MartPlace";
    const safeComment = escapeHtml(comment);

    const mailOptions = {
      from: FROM_ADDRESS,
      to: email,
      subject: "Terima kasih atas ulasan Anda di MartPlace",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #0779FF; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">Warungpedia</h1>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333;">Halo ${recipientName},</h2>
            <p style="color: #555; line-height: 1.6;">
              Terima kasih sudah menyempatkan waktu untuk memberikan komentar dan rating ${rating}⭐ terhadap produk kami di MartPlace.
            </p>
            <blockquote style="background:#fff; padding:15px; border-left:4px solid #0779FF; margin: 20px 0; color: #555; white-space: pre-wrap;">${safeComment}</blockquote>
            <p style="color: #555; line-height: 1.6;">
              Masukan Anda membantu penjual meningkatkan layanan. Jangan ragu kembali dan jelajahi produk lainnya di platform kami.
            </p>
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
              Email otomatis dari Warungpedia<br>
              © 2025 Warungpedia. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Thank-you email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to send thank-you email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
