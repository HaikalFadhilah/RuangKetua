import prisma from "@/lib/prisma";

interface ActivityInput {
  userId: string;
  action: string;
  entity: string;
  entityId?: string | null;
  description: string;
  metadata?: string | null;
}

export async function logActivity(input: ActivityInput) {
  try {
    await prisma.activityLog.create({ data: input });
  } catch (error) {
    console.error("Activity log error:", error);
  }
}
