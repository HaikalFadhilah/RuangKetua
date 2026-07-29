import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { errorResponse } from "@/lib/api-response";

function requireAdmin(request: NextRequest) {
  const role = request.headers.get("x-user-role");
  if (role !== "admin") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const authErr = requireAdmin(request);
    if (authErr) return authErr;

    const vouchers = await prisma.voucher.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: vouchers });
  } catch (error) {
    console.error("GET /api/admin/vouchers error:", error);
    return NextResponse.json({ success: false, error: "Gagal mengambil data voucher" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authErr = requireAdmin(request);
    if (authErr) return authErr;
    const body = await request.json();
    const { code, description, discountType, discountValue, maxUses, validFrom, validUntil, isActive, applicablePlan } = body;

    if (!code || !discountType || discountValue === undefined) {
      return NextResponse.json({ success: false, error: "Data wajib belum lengkap (Kode, Tipe Diskon, Nilai Diskon)" }, { status: 400 });
    }

    const existingCode = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (existingCode) {
      return NextResponse.json({ success: false, error: "Kode voucher sudah digunakan" }, { status: 400 });
    }

    const voucher = await prisma.voucher.create({
      data: {
        code: code.toUpperCase(),
        description,
        discountType,
        discountValue: parseInt(discountValue) || 0,
        maxUses: maxUses ? parseInt(maxUses) : null,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
        isActive: isActive ?? true,
        applicablePlan: applicablePlan || null,
      }
    });

    return NextResponse.json({ success: true, data: voucher });
  } catch (error) {
    console.error("POST /api/admin/vouchers error:", error);
    return NextResponse.json({ success: false, error: "Gagal membuat voucher" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authErr = requireAdmin(request);
    if (authErr) return authErr;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID tidak valid" }, { status: 400 });
    }

    await prisma.voucher.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/vouchers error:", error);
    return NextResponse.json({ success: false, error: "Gagal menghapus voucher" }, { status: 500 });
  }
}
