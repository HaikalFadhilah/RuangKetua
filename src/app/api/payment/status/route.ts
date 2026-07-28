import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const order_id = searchParams.get("order_id");
    const amount = searchParams.get("amount");

    if (!order_id) {
      return NextResponse.json({ success: false, error: "order_id diperlukan" }, { status: 400 });
    }

    const settings = await prisma.systemSettings.findFirst();
    if (!settings?.pakasirApiKey || !settings?.pakasirSlug) {
      return NextResponse.json({ success: false, error: "Konfigurasi Pakasir tidak valid" }, { status: 500 });
    }

    // Cek status transaksi langsung ke Pakasir (authoritative)
    const url =
      `https://app.pakasir.com/api/transactiondetail` +
      `?project=${encodeURIComponent(settings.pakasirSlug)}` +
      `&amount=${encodeURIComponent(amount || "")}` +
      `&order_id=${encodeURIComponent(order_id)}` +
      `&api_key=${encodeURIComponent(settings.pakasirApiKey)}`;

    const res = await fetch(url);
    const data = await res.json();
    const status = data?.transaction?.status ?? "pending";

    // Ambil role user yang sedang login agar redirect-nya tepat sasaran
    let role = "user";
    try {
      const userId = getUserIdFromRequest(request);
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (user) role = user.role;
    } catch {
      role = "user";
    }

    return NextResponse.json({
      success: true,
      data: { status, role },
    });
  } catch (error) {
    console.error("GET /api/payment/status error:", error);
    return NextResponse.json({ success: false, error: "Gagal mengecek status" }, { status: 500 });
  }
}
