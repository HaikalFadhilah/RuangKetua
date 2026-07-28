import { ContentPage } from "@/components/content/content-page";

export const metadata = {
  title: "Lisensi - Ruang Ketua",
  description: "Informasi lisensi perangkat lunak dan aset Ruang Ketua.",
};

export default function LisensiPage() {
  return (
    <ContentPage title="Lisensi" updated="Juli 2026">
      <p>
        Halaman ini menjelaskan lisensi yang berlaku untuk perangkat lunak dan aset yang digunakan
        dalam layanan Ruang Ketua.
      </p>

      <h2>Kode Sumber & Layanan</h2>
      <p>
        Seluruh kode, desain, dan konten Ruang Ketua adalah milik Ruang Ketua dan dilindungi oleh
        undang-undang hak kekayaan intelektual. Penggunaan komersial tanpa izin dilarang.
      </p>

      <h2>Pustaka Pihak Ketiga</h2>
      <p>
        Ruang Ketua menggunakan berbagai pustaka sumber terbuka yang tunduk pada lisensi
        masing-masing, antara lain MIT, Apache 2.0, dan lisensi serupa. Kami menghormati dan
        mematuhi ketentuan lisensi tersebut.
      </p>

      <h2>Merek Dagang</h2>
      <p>
        Nama, logo, dan identitas visual Ruang Ketua merupakan merek dagang kami dan tidak boleh
        digunakan tanpa persetujuan tertulis.
      </p>
    </ContentPage>
  );
}
