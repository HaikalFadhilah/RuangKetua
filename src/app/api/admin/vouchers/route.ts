import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function isAdminRequest(request: NextRequest) {
  const role = request.headers.get("x-user-role");
  return role === "admin" || role === "super_admin";
}

function forbiddenResponse() {
  return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
}

export async function GET(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) return forbiddenResponse();

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
    if (!isAdminRequest(request)) return forbiddenResponse();

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
    if (!isAdminRequest(request)) return forbiddenResponse();

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
