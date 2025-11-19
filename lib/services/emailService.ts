import nodemailer from "nodemailer";

interface EmailResult {
  success: boolean;
  error?: string;
}

export async function sendRejectionEmail(
  email: string,
  name: string,
  storeName: string,
  reason: string
): Promise<EmailResult> {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"Warungpedia" <${process.env.SMTP_USER}>`,
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
