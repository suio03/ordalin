import type { ToolPageCopy } from "./page-copy";

// id: head term crop foto bulat, twin crop foto jadi bulat (docs/i18n/README.md).
// Casual "kamu" register, as on the ranking local pages.
// Facts: docs/keywords/circle-crop-image.md, "Verified product facts".
export const circlePageId: ToolPageCopy = {
  title: "Crop Foto Bulat Online Gratis, Latar Transparan (PNG) | Ordalin",
  description:
    "Crop foto bulat langsung di browser: atur foto di dalam lingkaran lalu unduh PNG dengan latar transparan. Gratis, tanpa upload, daftar, atau watermark.",
  h1: "Crop Foto Bulat dengan Latar Transparan",
  subtitle:
    "Crop foto bulat langsung di browser: atur foto di dalam lingkaran lalu unduh PNG dengan latar transparan. Gratis, tanpa upload, daftar, atau watermark.",
  sections: [
    {
      id: "how-to",
      h2: "Cara crop foto jadi bulat",
      blocks: [
        {
          ol: [
            "**Tambahkan foto.** Letakkan di kotak di atas, atau ketuk untuk memilih dari HP atau komputer.",
            "**Atur lingkaran.** Seret gambar untuk menggesernya, lalu zoom dengan slider, scroll mouse, atau cubit dengan dua jari sampai bagian yang kamu mau ada di dalam lingkaran. Kamu bisa memperkecil melewati tepi foto supaya foto lebar masuk utuh.",
            "**Pilih hasil akhir dan unduh.** Biarkan sudutnya transparan atau isi dengan warna, tambahkan bingkai kalau mau, pilih ukuran dan format, lalu unduh foto bulatnya.",
          ],
        },
        { p: "Dua pratinjau menampilkan hasilnya di latar putih dan latar gelap, jadi kamu bisa melihat tepinya sebelum mengunduh." },
      ],
    },
    {
      id: "facts",
      h2: "Info singkat",
      blocks: [
        {
          table: {
            head: ["", ""],
            rows: [
              ["Fungsinya", "Alat gratis untuk crop foto bulat dan menyimpannya sebagai file sendiri"],
              ["Foto yang diterima", "JPG, PNG, atau WebP, maksimal 10 MB dan 40 megapiksel"],
              ["Unduhan bawaan", "PNG dengan sudut transparan penuh, seukuran piksel area lingkaran di foto kamu"],
              ["Ukuran lain", "Diameter 512, 1080, atau 2048 px; maksimal 4096 px"],
              ["Format", "PNG, WebP, atau JPG"],
              ["Di luar lingkaran", "Transparan, putih, hitam, atau warna pilihan kamu"],
              ["Bingkai", "Cincin opsional dengan warna apa saja, 0,5% sampai 5% dari lebar"],
              ["Tempat diproses", "Di browser kamu. Foto tidak dikirim ke Ordalin atau pihak lain"],
            ],
          },
        },
      ],
    },
    {
      id: "background",
      h2: "Sudut transparan atau warna polos?",
      blocks: [
        {
          p: "Foto yang sudah di-crop bulat tetap disimpan sebagai file persegi. Empat sudut di luar lingkaran harus diisi sesuatu: kosong (transparan) atau warna. Pilih sesuai tempat foto akan dipakai.",
        },
        {
          ul: [
            "**Transparan** cocok untuk slide, dokumen, website, stiker, dan logo, supaya latar di belakangnya tetap terlihat. Hanya PNG dan WebP yang bisa menyimpannya.",
            "**Putih atau hitam** lebih aman untuk aplikasi yang tidak mendukung transparansi. Beberapa aplikasi menampilkan sudut kosong sebagai kotak hitam atau putih, jadi kelihatan seperti salah. Samakan warnanya dengan latar halaman supaya tidak terlihat.",
            "**Warna pilihan** menjadikan sudutnya latar yang disengaja, misalnya warna brand di belakang foto tim.",
          ],
        },
        {
          p: "Aplikasi yang sudah menampilkan foto profil berbentuk bulat, seperti WhatsApp, Instagram, atau TikTok, memotong perseginya sendiri, jadi sudutnya tidak pernah terlihat. Tetap ada gunanya crop dulu: kamu yang menentukan bagian mana yang masuk lingkaran, bukan aplikasinya.",
        },
      ],
    },
    {
      id: "sharp",
      h2: "Supaya foto bulat tetap tajam",
      blocks: [
        {
          p: "Lingkaran yang buram biasanya terjadi karena gambar diperbesar melebihi ukuran asli fotonya. Menu ukuran menunjukkan berapa piksel yang tercakup lingkaran di foto kamu, dan pilihan \"Asli\" menyimpan persis ukuran itu tanpa ditarik.",
        },
        {
          ul: [
            "Pakai foto asli, bukan screenshot atau gambar yang disimpan dari chat, karena biasanya sudah diperkecil.",
            "Semakin jauh kamu zoom, semakin sedikit piksel asli di dalam lingkaran. Kalau ukuran aslinya kurang dari yang kamu butuhkan, perlebar area crop atau pakai foto yang lebih besar.",
            "Kalau kamu memilih ukuran yang lebih besar dari area lingkaran, alat ini memberi tahu bahwa gambar akan diperbesar dan terlihat kurang tajam.",
            "Pakai PNG untuk logo, teks, dan warna rata. JPG cukup untuk foto dengan latar warna, dan ukurannya lebih kecil.",
          ],
        },
      ],
    },
    {
      id: "uses",
      h2: "Foto bulat biasanya dipakai untuk apa",
      blocks: [
        {
          ul: [
            "**Foto profil:** PP bulat untuk WhatsApp, Discord, Telegram, atau forum, dengan wajah di tengah, bukan di posisi yang ditebak aplikasi.",
            "**Logo dan badge:** logo bulat dengan bingkai dan sudut transparan, siap ditempel di website, slide, atau foto produk.",
            "**Halaman tim atau pembicara:** semua foto wajah dengan lingkaran yang sama, supaya rapi saat dijejerkan.",
            "**Slide dan dokumen:** foto bulat yang pas di latar warna apa pun, tanpa kotak putih di sekelilingnya.",
          ],
        },
      ],
    },
    {
      id: "other-ways",
      h2: "Cara lain crop foto jadi bulat",
      blocks: [
        {
          table: {
            head: ["Cara", "Cocok saat", "Kurang cocok saat"],
            rows: [
              [
                "Alat di browser seperti ini",
                "Kamu butuh file bulat terpisah, transparan atau berwarna, dari perangkat apa saja",
                "Kamu perlu mengedit banyak gambar sekaligus (alat ini satu per satu)",
              ],
              [
                "PowerPoint atau Word: Format Gambar › Pangkas › Pangkas ke Bentuk › Oval",
                "Lingkarannya cukup terlihat di slide atau dokumen itu saja",
                "Kamu butuh lingkarannya sebagai file; di bawah bentuk itu fotonya tetap persegi panjang",
              ],
              [
                "Google Slide: panah di samping Pangkas › Masker gambar › Bentuk › Oval",
                "Kamu memang sedang membuat slide di Google",
                "Fotonya tidak persegi: hasilnya jadi oval sampai kamu crop persegi dulu",
              ],
              [
                "Aplikasi desain dengan bingkai bulat",
                "Lingkarannya bagian dari desain yang lebih besar",
                "Kamu cuma butuh satu file bulat dan tidak mau bikin akun atau bayar untuk ekspor transparan",
              ],
              [
                "Aplikasi Foto di iPhone",
                "Crop persegi sudah cukup, karena aplikasi tujuan akan membulatkannya",
                "Kamu butuh lingkaran sungguhan: Foto paling jauh hanya bisa crop persegi",
              ],
            ],
          },
        },
      ],
    },
    {
      id: "limits",
      h2: "Cocok untuk apa, tidak untuk apa",
      blocks: [
        {
          ul: [
            "**Cocok untuk:** crop foto bulat satu per satu, dengan hasil bersih yang bisa dipakai di mana saja.",
            "**Tidak untuk:** bentuk lain, oval, atau banyak foto sekaligus. Foto HEIC dari iPhone tidak diterima; ubah dulu ke JPG.",
            "**Sebelum mulai:** gambar di atas 10 MB atau 40 megapiksel ditolak supaya tab browser tidak kehabisan memori. Kecilkan dulu file kamera yang sangat besar.",
          ],
        },
      ],
    },
  ],
  faqHeading: "Pertanyaan umum",
  faq: [
    {
      q: "Apakah crop foto bulat di sini gratis?",
      a: "Ya. Tidak perlu daftar, tidak ada watermark dan tidak ada paket berbayar, termasuk unduhan PNG transparan.",
    },
    {
      q: "Bagaimana cara crop foto bulat dengan latar transparan?",
      a: "Biarkan \"Di luar lingkaran\" di Transparan, lalu unduh sebagai PNG atau WebP. Semua yang ada di luar lingkaran disimpan sebagai piksel kosong, jadi latar di belakangnya akan terlihat.",
    },
    {
      q: "Kenapa sudut foto bulat saya jadi putih atau hitam?",
      a: "Filenya disimpan sebagai JPG yang tidak bisa transparan, atau aplikasi yang membukanya menampilkan piksel kosong sebagai warna. Unduh PNG, atau isi sudutnya dengan warna latar tempat foto akan ditempel.",
    },
    {
      q: "Apakah foto saya di-upload?",
      a: "Tidak. Foto dibaca, di-crop, dan disimpan oleh browser di perangkat kamu sendiri. Tidak ada yang dikirim ke server, jadi aman juga untuk foto pribadi.",
    },
    {
      q: "Bisa tambahkan bingkai di lingkaran?",
      a: "Bisa. Geser slider bingkai untuk mengatur ketebalan, lalu pilih warnanya. Bingkai digambar di sisi dalam lingkaran, jadi tidak akan terpotong.",
    },
    {
      q: "Berapa ukuran foto profil bulat yang pas?",
      a: "Foto profil tampil kecil, jadi diameter 512 atau 1080 px sudah cukup untuk kebanyakan aplikasi. Pilih \"Asli\" kalau ingin detail sebanyak mungkin.",
    },
    {
      q: "Bisa dipakai di HP Android dan iPhone?",
      a: "Bisa, lewat browser HP. Seret dengan satu jari, cubit dengan dua jari untuk zoom, lalu unduh ke galeri atau file.",
    },
    {
      q: "Bisa crop foto jadi bulat kalau fotonya lebar atau tinggi?",
      a: "Bisa. Geser lingkaran ke bagian mana pun, atau perkecil sampai seluruh foto masuk ke lingkaran; ruang kosong di sekitarnya mengikuti latar yang kamu pilih.",
    },
    {
      q: "Format apa saja yang bisa diunduh?",
      a: "PNG, WebP, dan JPG. PNG dan WebP menjaga sudut tetap transparan; JPG mengisinya dengan putih kecuali kamu memilih warna.",
    },
    {
      q: "Boleh dipakai untuk keperluan komersial?",
      a: "Ordalin tidak menambahkan apa pun ke gambar dan tidak mengklaim hak atasnya. Boleh tidaknya dipakai komersial tergantung siapa pemilik foto aslinya.",
    },
  ],
  closing:
    "Butuh seluruh foto jadi persegi, bukan bulat? Pakai [Square an image](/free-tools/square-an-image) (bahasa Inggris) untuk membuat foto persegi tanpa terpotong, atau [mirror foto](/id/free-tools/flip-image) dulu kalau arahnya terbalik. Lihat juga [alat gratis untuk gambar](/id/free-tools) lainnya dan [direktori alat AI Ordalin](/) (dalam bahasa Inggris).",
};
