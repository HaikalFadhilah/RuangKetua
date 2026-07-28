import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, plan } = body;

    if (!orderId || amount == null || Number.isNaN(Number(amount)) || Number(amount) < 0) {
      return NextResponse.json({ success: false, error: "Order ID dan amount diperlukan" }, { status: 400 });
    }

    const settings = await prisma.systemSettings.findFirst();
    if (!settings || !settings.pakasirApiKey || !settings.pakasirSlug) {
      return NextResponse.json({ success: false, error: "Konfigurasi Pakasir tidak valid" }, { status: 500 });
    }

    // Ambil userId agar order_id membawa identitas user.
    // Webhook Pakasir membutuhkan userId di dalam order_id untuk mencocokkan
    // pembayaran ke akun yang benar.
    let userId = "";
    try {
      userId = getUserIdFromRequest(request);
    } catch {
      userId = "";
    }

    // Susun ulang order_id agar mengandung userId (prefix 8 char) dan, bila
    // pakai voucher, kode voucher-nya agar webhook bisa mencatat pemakaian.
    // Format final: RK-{PLAN}-{userId8}-{timestamp}-{rand}[-{VOUCHER}-V]
    // Contoh: RK-MONTHLY-cm1abc12-1720000000-a1b2c3  (atau ...-HELLO-V)
    const planKey = (plan || orderId.split("-")[1] || "monthly").toUpperCase();
    const voucherCodeFromBody = body.voucherCode ? String(body.voucherCode).toUpperCase() : null;
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 8);
    const finalOrderId = `RK-${planKey}-${userId ? userId.slice(0, 8) : "guest"}-${ts}-${rand}${voucherCodeFromBody ? `-${voucherCodeFromBody}-V` : ""}`;

    // Panggil API Pakasir untuk membuat transaksi QRIS.
    // Responnya berisi "payment_number" = string QRIS mentah yang harus kita
    // render sendiri menjadi barcode (bukan embed halaman Pakasir utuh).
    const pakasirRes = await fetch("https://app.pakasir.com/api/transactioncreate/qris", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project: settings.pakasirSlug,
        order_id: finalOrderId,
        amount: Math.round(Number(amount)),
        api_key: settings.pakasirApiKey,
      }),
    });

    const pakasirData = await pakasirRes.json();

    if (!pakasirRes.ok || !pakasirData?.payment?.payment_number) {
      console.error("Pakasir transactioncreate error:", pakasirData);
      return NextResponse.json(
        { success: false, error: pakasirData?.message || "Gagal membuat QRIS dari gateway" },
        { status: 502 }
      );
    }

    const payment = pakasirData.payment;

    return NextResponse.json({
      success: true,
      data: {
        qrString: payment.payment_number,
        amount: Number(amount),
        totalPayment: payment.total_payment ?? Number(amount),
        expiredAt: payment.expired_at ?? null,
        orderId: finalOrderId,
      },
    });

  } catch (error) {
    console.error("POST /api/payment/qris error:", error);
    return NextResponse.json({ success: false, error: "Gagal membuat koneksi ke gateway" }, { status: 500 });
  }
}
