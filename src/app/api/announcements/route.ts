import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse, paginatedResponse, getPaginationParams } from "@/lib/api-response";
import { getUserIdFromRequest } from "@/lib/api-utils";
import { getWhatsAppService } from "@/lib/whatsapp/service";

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = getPaginationParams(searchParams);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";


    const where: any = { userId };
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ];
    }
    if (category) where.category = category;

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
      }),
      prisma.announcement.count({ where }),
    ]);

    return paginatedResponse(announcements, total, page, limit);
  } catch (error) {
    console.error("Announcements GET error:", error);
    return errorResponse("Gagal mengambil pengumuman", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    const userRole = request.headers.get("x-user-role") || "";
    const body = await request.json();
    const { title, content, category, pinned } = body;

    if (!title || !content) return errorResponse("Judul dan konten wajib diisi", 400);

    const announcement = await prisma.announcement.create({
      data: {
        userId,
        title,
        content,
        category: category || "general",
        pinned: pinned || false,
        broadcast: userRole === "admin" ? (body.broadcast || false) : false,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        action: "CREATE",
        entity: "announcement",
        entityId: announcement.id,
        description: `Membuat pengumuman: ${announcement.title}`,
      },
    });

    const broadcastResult: { requested: boolean; sent: boolean; error?: string } = {
      requested: Boolean(broadcast),
      sent: false,
    };

    if (broadcast) {
      try {
        const session = await prisma.whatsAppSession.findUnique({ where: { userId } });
        if (!session?.groupId) {
          broadcastResult.error = "Pilih grup WhatsApp utama terlebih dahulu";
        } else {
          const waService = getWhatsAppService(userId);
          if (!(await waService.ensureConnected())) {
            broadcastResult.error = "WhatsApp tidak terhubung";
          } else {
            const message = `*${announcement.title}*\n\n${announcement.content}`;
            broadcastResult.sent = await waService.broadcastToGroup(session.groupId, message);

            if (broadcastResult.sent) {
              await prisma.activityLog.create({
                data: {
                  userId,
                  action: "BROADCAST",
                  entity: "announcement",
                  entityId: announcement.id,
                  description: `Broadcast pengumuman ke ${session.groupName || "grup utama"}: ${announcement.title}`,
                },
              });
            }
          }
        }
      } catch (error) {
        broadcastResult.error = error instanceof Error ? error.message : "Broadcast gagal";
      }
    }

    return successResponse({ ...announcement, _broadcast: broadcastResult }, "Pengumuman berhasil dibuat", 201);
  } catch (error) {
    console.error("Announcements POST error:", error);
    return errorResponse("Gagal membuat pengumuman", 500);
  }
}
