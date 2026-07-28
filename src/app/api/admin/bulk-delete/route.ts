import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const userRole = request.headers.get("x-user-role");
    if (userRole !== "admin") return errorResponse("Unauthorized", 403);

    const body = await request.json();
    const { type, ids } = body;

    if (!type || !ids || !Array.isArray(ids) || ids.length === 0) {
      return errorResponse("Data tidak lengkap", 400);
    }

    let result;

    switch (type) {
      case "users":
        result = await prisma.user.deleteMany({
          where: { id: { in: ids } },
        });
        break;
      case "forums":
        result = await prisma.forumPost.deleteMany({
          where: { id: { in: ids } },
        });
        break;
      case "chats":
        result = await prisma.chatMessage.deleteMany({
          where: { id: { in: ids } },
        });
        break;
      case "vouchers":
        result = await prisma.voucher.deleteMany({
          where: { id: { in: ids } },
        });
        break;
      default:
        return errorResponse("Tipe data tidak valid", 400);
    }

    return successResponse({ count: result.count }, `${result.count} data berhasil dihapus`);
  } catch (error) {
    console.error("Bulk delete error:", error);
    return errorResponse("Gagal menghapus data", 500);
  }
}
