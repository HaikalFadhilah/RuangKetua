import { ContentPage } from "@/components/content/content-page";

export const metadata = {
  title: "Kebijakan Privasi - Ruang Ketua",
  description: "Bagaimana Ruang Ketua mengumpulkan, menggunakan, dan melindungi data Anda.",
};

export default function KebijakanPrivasiPage() {
  return (
    <ContentPage title="Kebijakan Privasi" updated="Juli 2026">
      <p>
        Kami menghargai privasi Anda. Kebijakan ini menjelaskan bagaimana kami mengumpulkan,
        menggunakan, dan melindungi informasi yang Anda berikan.
      </p>

      <h2>1. Data yang Kami Kumpulkan</h2>
      <ul>
        <li>Informasi akun seperti nama dan alamat email.</li>
        <li>Data kelas yang Anda buat dan kelola di platform.</li>
        <li>Log teknis untuk menjaga keamanan layanan.</li>
      </ul>

      <h2>2. Penggunaan Data</h2>
      <p>
        Data digunakan untuk menyediakan, memelihara, dan meningkatkan layanan Ruang Ketua serta
        untuk keperluan komunikasi terkait akun Anda.
      </p>

      <h2>3. Penyimpanan & Keamanan</h2>
      <p>
        Kami menerapkan langkah-langkah keamanan yang wajar untuk melindungi data Anda dari akses
        yang tidak sah. Data disimpan selama akun Anda aktif atau sebagaimana diperlukan untuk
        menyediakan layanan.
      </p>

      <h2>4. Berbagi Data</h2>
      <p>
        Kami tidak menjual data pribadi Anda. Data hanya dibagikan kepada pihak ketiga yang membantu
        operasional layanan, dengan komitmen kerahasiaan.
      </p>

      <h2>5. Hak Anda</h2>
      <p>
        Anda dapat meminta akses, perbaikan, atau penghapusan data pribadi Anda kapan saja dengan
        menghubungi kami melalui halaman <a href="/kontak">Kontak</a>.
      </p>
    </ContentPage>
  );
}
