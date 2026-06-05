import nodemailer from "nodemailer";

const isConfigured =
  !!process.env.EMAIL_HOST &&
  !!process.env.EMAIL_USER &&
  !!process.env.EMAIL_PASSWORD;

const transporter = isConfigured
  ? nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || "587"),
      secure: process.env.EMAIL_PORT === "465",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
    })
  : null;

const FROM = process.env.EMAIL_FROM || "MirrorME <noreply@mirrorme.app>";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!transporter) {
    // Dev fallback — print to console so developers can test flows without SMTP
    console.log(`\n📧  EMAIL (not sent — configure EMAIL_* env vars to enable)\n  To: ${to}\n  Subject: ${subject}\n  ${html.replace(/<[^>]+>/g, "")}\n`);
    return;
  }
  await transporter.sendMail({ from: FROM, to, subject, html });
}

export const emailService = {
  sendPasswordReset: async (to: string, token: string): Promise<void> => {
    const link = `${APP_URL}/reset-password?token=${token}`;
    await send(
      to,
      "Reset your MirrorME password",
      `<div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0A0A0A;color:#fff;border-radius:16px;padding:32px">
        <h1 style="color:#C8FF00;font-size:24px;margin-bottom:8px">MirrorME</h1>
        <p style="color:#aaa;margin-bottom:24px">You requested a password reset.</p>
        <a href="${link}" style="display:inline-block;background:#C8FF00;color:#0A0A0A;font-weight:700;padding:14px 28px;border-radius:12px;text-decoration:none;font-size:15px">Reset Password</a>
        <p style="color:#555;font-size:12px;margin-top:24px">This link expires in 1 hour. If you didn't request this, ignore this email — your account is safe.</p>
        <p style="color:#333;font-size:11px">Or copy this link: ${link}</p>
      </div>`
    );
  },

  sendWelcome: async (to: string, username: string): Promise<void> => {
    await send(
      to,
      "Welcome to MirrorME!",
      `<div style="font-family:sans-serif;max-width:480px;margin:auto;background:#0A0A0A;color:#fff;border-radius:16px;padding:32px">
        <h1 style="color:#C8FF00;font-size:24px;margin-bottom:8px">Welcome, @${username}!</h1>
        <p style="color:#aaa">You're now part of the MirrorME fashion community. Start uploading your outfits and get styled by AI.</p>
      </div>`
    );
  },
};
