import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse, paginatedResponse, getPaginationParams } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(searchParams);
    const search = searchParams.get("search") || "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [dosenList, total] = await Promise.all([
      prisma.dosen.findMany({
        where,
        include: { courses: { select: { id: true, name: true, code: true } } },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.dosen.count({ where }),
    ]);

    return paginatedResponse(dosenList, total, page, limit);
  } catch (error) {
    console.error("Dosen GET error:", error);
    return errorResponse("Gagal mengambil data dosen", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, whatsapp, email, consultHours, courseIds } = body;

    if (!name) return errorResponse("Nama dosen wajib diisi", 400);

    const dosen = await prisma.dosen.create({
      data: {
        name,
        whatsapp: whatsapp || null,
        email: email || null,
        consultHours: consultHours || null,
        courses: courseIds?.length
          ? { connect: courseIds.map((id: string) => ({ id })) }
          : undefined,
      },
      include: { courses: { select: { id: true, name: true, code: true } } },
    });

    return successResponse(dosen, "Dosen berhasil ditambahkan", 201);
  } catch (error) {
    console.error("Dosen POST error:", error);
    return errorResponse("Gagal menambahkan dosen", 500);
  }
}
