"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const LandingPageContent = dynamic(
  () => import("@/components/landing/LandingPageContent"),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
  }
);

export default function HomePage() {
  return <LandingPageContent />;
}
