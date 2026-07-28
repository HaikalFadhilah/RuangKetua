import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Public endpoint — no auth required
// GET /api/public/universities?search=ui&limit=20
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() ?? "";
    const limit  = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);

    const universities = await prisma.university.findMany({
      where: {
        isActive: true,
        ...(search
          ? {
              OR: [
                { name:      { contains: search } },
                { shortName: { contains: search } },
                { city:      { contains: search } },
              ],
            }
          : {}),
      },
      select: { id: true, name: true, shortName: true, city: true },
      orderBy: { name: "asc" },
      take: limit,
    });

    return NextResponse.json({ success: true, data: universities });
  } catch (error) {
    console.error("GET /api/public/universities error:", error);
    return NextResponse.json({ success: false, error: "Terjadi kesalahan" }, { status: 500 });
  }
}
