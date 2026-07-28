"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function ContactForm() {
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [pesan, setPesan] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(`Pesan dari ${nama || "Pengunjung"}`);
    const body = encodeURIComponent(
      `Nama: ${nama}\nEmail: ${email}\n\n${pesan}`
    );
    window.location.href = `mailto:halo@ruangketua.id?subject=${subject}&body=${body}`;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="cf-nama">Nama</Label>
        <Input id="cf-nama" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama Anda" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cf-email">Email</Label>
        <Input id="cf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cf-pesan">Pesan</Label>
        <Textarea id="cf-pesan" className="min-h-[120px]" value={pesan} onChange={(e) => setPesan(e.target.value)} placeholder="Tuliskan pertanyaan atau pesan Anda…" required />
      </div>
      <Button type="submit" className="w-full gap-2">
        <Send className="h-4 w-4" /> Kirim lewat Email
      </Button>
      <p className="text-xs text-muted-foreground">
        Form ini akan membuka aplikasi email Anda dengan pesan terisi otomatis.
      </p>
    </form>
  );
}
