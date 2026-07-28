import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardShell from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hdrs = await headers();
  const userId = hdrs.get("x-user-id");
  const role = hdrs.get("x-user-role");

  // Admin bebas akses (tidak di-lock paywall)
  if (userId && role !== "admin") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionEnd: true, subscriptionPlan: true },
    });

    if (user) {
      const expired =
        !user.subscriptionEnd || new Date(user.subscriptionEnd) < new Date();
      if (expired) {
        redirect("/locked");
      }
    }
  }

  return <DashboardShell>{children}</DashboardShell>;
}
