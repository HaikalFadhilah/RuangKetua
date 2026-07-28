import { ContentPage } from "@/components/content/content-page";

export const metadata = {
  title: "Kebijakan Cookie - Ruang Ketua",
  description: "Penjelasan mengenai penggunaan cookie pada layanan Ruang Ketua.",
};

export default function KebijakanCookiePage() {
  return (
    <ContentPage title="Kebijakan Cookie" updated="Juli 2026">
      <p>
        Ruang Ketua menggunakan cookie dan teknologi serupa untuk meningkatkan pengalaman pengguna
        serta menjaga keamanan layanan.
      </p>

      <h2>Apa itu Cookie</h2>
      <p>
        Cookie adalah file kecil yang disimpan di perangkat Anda saat menggunakan layanan kami.
        Cookie membantu kami mengenali sesi dan preferensi Anda.
      </p>

      <h2>Jenis Cookie yang Kami Gunakan</h2>
      <ul>
        <li><strong>Cookie wajib</strong>: diperlukan agar layanan berfungsi, seperti autentikasi.</li>
        <li><strong>Cookie preferensi</strong>: menyimpan pengaturan tampilan Anda.</li>
        <li><strong>Cookie analitik</strong>: membantu kami memahami cara layanan digunakan.</li>
      </ul>

      <h2>Mengelola Cookie</h2>
      <p>
        Anda dapat mengatur atau menonaktifkan cookie melalui pengaturan browser Anda. Namun,
        menonaktifkan cookie tertentu dapat memengaruhi fungsi layanan.
      </p>
    </ContentPage>
  );
}
