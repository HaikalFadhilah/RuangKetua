import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import prisma from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/api-utils";
import { logActivity } from "@/lib/activity";

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) return errorResponse("Unauthorized", 401);

    const members = await prisma.classMember.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    });

    return successResponse(members);
  } catch (error: any) {
    console.error("GET /api/members error:", error);
    return errorResponse(error.message || "Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) return errorResponse("Unauthorized", 401);

    const body = await request.json();
    const { name, nim, phone, email, gender, status, notes, memberType, revisiCourses } = body;

    if (!name) return errorResponse("Nama wajib diisi", 400);

    const newMember = await prisma.classMember.create({
      data: {
        userId,
        name,
        nim,
        phone,
        email,
        gender,
        status: status || "ACTIVE",
        memberType: memberType || "REGULER",
        revisiCourses: memberType === "REVISIAN" ? revisiCourses : null,
        notes,
      },
    });

    await logActivity({
      userId,
      action: "CREATE",
      entity: "member",
      entityId: newMember.id,
      description: `Menambahkan anggota kelas: ${newMember.name}`,
    });

    return successResponse(newMember, undefined, 201);
  } catch (error: any) {
    console.error("POST /api/members error:", error);
    return errorResponse(error.message || "Internal server error", 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) return errorResponse("Unauthorized", 401);

    const body = await request.json();
    const { id, name, nim, phone, email, gender, status, notes, memberType, revisiCourses } = body;

    if (!id) return errorResponse("ID is required", 400);
    if (!name) return errorResponse("Nama wajib diisi", 400);

    const updatedMember = await prisma.classMember.update({
      where: { id, userId },
      data: {
        name,
        nim,
        phone,
        email,
        gender,
        status: status || "ACTIVE",
        memberType: memberType || "REGULER",
        revisiCourses: memberType === "REVISIAN" ? revisiCourses : null,
        notes,
      },
    });

    await logActivity({
      userId,
      action: "UPDATE",
      entity: "member",
      entityId: updatedMember.id,
      description: `Mengupdate anggota kelas: ${updatedMember.name}`,
    });

    return successResponse(updatedMember, undefined, 200);
  } catch (error: any) {
    console.error("PUT /api/members error:", error);
    return errorResponse(error.message || "Internal server error", 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) return errorResponse("Unauthorized", 401);

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    const bulkIds = url.searchParams.get("bulkIds");

    if (bulkIds) {
      const ids = bulkIds.split(",");
      await prisma.classMember.deleteMany({
        where: { userId, id: { in: ids } },
      });
      await logActivity({
        userId,
        action: "DELETE",
        entity: "member",
        description: `Menghapus ${ids.length} anggota kelas`,
        metadata: JSON.stringify({ ids }),
      });
      return successResponse({ deleted: ids.length });
    }

    if (!id) return errorResponse("ID is required", 400);

    const deletedMember = await prisma.classMember.delete({
      where: { id, userId },
    });

    await logActivity({
      userId,
      action: "DELETE",
      entity: "member",
      entityId: id,
      description: `Menghapus anggota kelas: ${deletedMember.name}`,
    });

    return successResponse({ deleted: 1 });
  } catch (error: any) {
    console.error("DELETE /api/members error:", error);
    return errorResponse(error.message || "Internal server error", 500);
  }
}
