import { Resend } from "resend";

export type PasswordResetSendResult = {
  delivered: boolean;
  method: "resend" | "console";
};

function getApiKey(): string | null {
  return process.env.RESEND_API_KEY?.trim() || null;
}

function getFromAddress(): string {
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (from) return from;
  const name = process.env.NEXT_PUBLIC_APP_NAME?.trim() || "Ruang Ketua";
  return `${name} <noreply@ruangketua.com>`;
}

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME?.trim() || "Ruang Ketua";

function buildResetEmail(token: string, baseUrl: string): { subject: string; html: string } {
  const resetUrl = `${baseUrl}/reset-password`;
  const subject = `${APP_NAME} — Kode reset password`;

  const html = `<!DOCTYPE html>
<html lang="id">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:48px 20px">
<tr><td align="center">
<table width="460" cellpadding="0" cellspacing="0" style="max-width:460px;width:100%">

  <!-- Logo -->
  <tr><td style="padding-bottom:32px">
    <p style="margin:0;font-size:17px;font-weight:700;color:#18181b">${APP_NAME}</p>
  </td></tr>

  <!-- Card -->
  <tr><td style="background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;padding:36px 32px">
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#3f3f46">
      Ada permintaan reset password untuk akun Anda. Masukkan kode berikut di halaman reset:
    </p>

    <div style="text-align:center;margin:28px 0;padding:20px;background:#fafafa;border:1px solid #e4e4e7;border-radius:8px">
      <span style="font-size:32px;font-weight:700;letter-spacing:0.3em;color:#18181b;font-family:ui-monospace,SFMono-Regular,Consolas,monospace">${token}</span>
    </div>

    <p style="margin:0 0 24px;font-size:13px;line-height:1.6;color:#71717a">
      Kode ini berlaku 30 menit. Jika Anda tidak meminta ini, abaikan saja email ini.
    </p>

    <a href="${resetUrl}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:11px 24px;border-radius:8px;font-size:14px;font-weight:500">Reset password</a>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding-top:28px;text-align:center">
    <p style="margin:0;font-size:12px;color:#a1a1aa">${APP_NAME} &mdash; ruangketua.com</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  return { subject, html };
}

export async function sendPasswordResetEmail(
  to: string,
  token: string
): Promise<PasswordResetSendResult> {
  const apiKey = getApiKey();

  // Fallback: no API key configured -> log to server console so the owner
  // can still retrieve the code (e.g. via `pm2 logs`) without exposing it in HTTP.
  if (!apiKey) {
    console.log(
      `[mailer] RESEND_API_KEY belum dikonfigurasi. Kode reset untuk ${to}: ${token}`
    );
    return { delivered: false, method: "console" };
  }

  try {
    const origin =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      "https://ruangketua.com";
    const { subject, html } = buildResetEmail(token, origin);

    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: getFromAddress(),
      to,
      subject,
      html,
    });

    return { delivered: true, method: "resend" };
  } catch (error) {
    console.error("[mailer] Gagal kirim email reset:", error);
    return { delivered: false, method: "console" };
  }
}

export type MagicLinkSendResult = {
  delivered: boolean;
  method: "resend" | "console";
};

export async function sendMagicLinkEmail(
  to: string,
  link: string
): Promise<MagicLinkSendResult> {
  const apiKey = getApiKey();

  if (!apiKey) {
    console.log(`[mailer] RESEND_API_KEY belum dikonfigurasi. Magic link untuk ${to}: ${link}`);
    return { delivered: false, method: "console" };
  }

  try {
    const subject = `${APP_NAME} — Login tanpa password`;

    const html = `<!DOCTYPE html>
<html lang="id">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:48px 20px">
<tr><td align="center">
<table width="460" cellpadding="0" cellspacing="0" style="max-width:460px;width:100%">

  <!-- Logo -->
  <tr><td style="padding-bottom:32px">
    <p style="margin:0;font-size:17px;font-weight:700;color:#18181b">${APP_NAME}</p>
  </td></tr>

  <!-- Card -->
  <tr><td style="background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;padding:36px 32px">
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#3f3f46">
      Klik tombol di bawah untuk masuk ke akun Anda. Link ini berlaku 10 menit dan hanya bisa dipakai sekali.
    </p>

    <a href="${link}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:11px 24px;border-radius:8px;font-size:14px;font-weight:500">Masuk ke akun</a>

    <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#a1a1aa">
      Kalau tombol tidak berfungsi, salin link ini ke browser:<br>
      <span style="color:#71717a;word-break:break-all">${link}</span>
    </p>

    <p style="margin:16px 0 0;font-size:12px;color:#a1a1aa">
      Bukan Anda yang meminta? Abaikan email ini.
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding-top:28px;text-align:center">
    <p style="margin:0;font-size:12px;color:#a1a1aa">${APP_NAME} &mdash; ruangketua.com</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: getFromAddress(),
      to,
      subject,
      html,
    });

    return { delivered: true, method: "resend" };
  } catch (error) {
    console.error("[mailer] Gagal kirim magic link:", error);
    return { delivered: false, method: "console" };
  }
}