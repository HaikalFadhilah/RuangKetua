import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userRole = request.headers.get("x-user-role");
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") as "PUBLIC" | "INTERNAL_CAMPUS" | null;

  // Determine university filter
  let university: string | null = null;
  if (category === "INTERNAL_CAMPUS" && userRole !== "admin") {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { university: true },
    });
    if (!currentUser?.university) {
      return new Response("Universitas belum diatur", { status: 400 });
    }
    university = currentUser.university;
  }

  const encoder = new TextEncoder();
  let lastCheckedAt = new Date();
  let cancelled = false;

  // Abort when client disconnects
  request.signal.addEventListener("abort", () => { cancelled = true; });

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial heartbeat
      controller.enqueue(encoder.encode(": heartbeat\n\n"));

      let tickCount = 0;

      const poll = async () => {
        if (cancelled) {
          try { controller.close(); } catch { /* already closed */ }
          return;
        }

        try {
          const whereClause: Record<string, unknown> = {
            createdAt: { gt: lastCheckedAt },
          };

          if (category === "INTERNAL_CAMPUS") {
            whereClause.category = "INTERNAL_CAMPUS";
            if (university) whereClause.university = university;
          } else {
            whereClause.category = "PUBLIC";
          }

          const newMessages = await prisma.chatMessage.findMany({
            where: whereClause,
            include: {
              user: {
                select: { id: true, name: true, avatar: true, className: true, university: true, role: true },
              },
            },
            orderBy: { createdAt: "asc" },
          });

          if (newMessages.length > 0) {
            lastCheckedAt = newMessages[newMessages.length - 1].createdAt;
            const data = JSON.stringify(newMessages);
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }

          // Periodic heartbeat every ~25s (17 ticks * 1.5s) to keep connection alive behind proxies
          tickCount++;
          if (tickCount % 17 === 0) {
            controller.enqueue(encoder.encode(": heartbeat\n\n"));
          }
        } catch (err) {
          console.error("SSE poll error:", err);
        }

        if (!cancelled) {
          setTimeout(poll, 1500);
        } else {
          try { controller.close(); } catch { /* already closed */ }
        }
      };

      // Start polling after a small delay
      setTimeout(poll, 500);
    },
    cancel() {
      cancelled = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
