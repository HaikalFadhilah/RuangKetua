import Link from "next/link";
import { RuangKetuaLogo } from "@/components/ui/ruang-ketua-logo";

const FOOTER_COLUMNS = [
  {
    title: "Produk",
    links: [
      { label: "Fitur", href: "/#fitur" },
      { label: "Harga", href: "/#harga" },
      { label: "Update Terbaru", href: "/#testimoni" },
      { label: "Roadmap", href: "/#faq" },
    ],
  },
  {
    title: "Perusahaan",
    links: [
      { label: "Tentang Kami", href: "/tentang-kami" },
      { label: "Blog", href: "/blog" },
      { label: "Kontak", href: "/kontak" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Syarat & Ketentuan", href: "/syarat-ketentuan" },
      { label: "Kebijakan Privasi", href: "/kebijakan-privasi" },
      { label: "Kebijakan Cookie", href: "/kebijakan-cookie" },
      { label: "Lisensi", href: "/lisensi" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-14 bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <RuangKetuaLogo size={40} />
              <span className="font-bold text-sm">
                Ruang<span className="text-primary">Ketua</span>
              </span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Platform manajemen kelas digital untuk Ketua Kelas Mahasiswa Indonesia. Satu dashboard
              untuk semua urusan kelas.
            </p>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                {col.title}
              </div>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Ruang Ketua. Dibuat dengan semangat untuk mahasiswa
            Indonesia.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Semua sistem berjalan normal
          </div>
        </div>
      </div>
    </footer>
  );
}
