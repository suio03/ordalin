import type { ToolPageCopy } from "@/lib/free-tools/image-shape/page-copy";

// id: head term mirror foto (ID 880), with mirror foto online / cara mirror foto / mirror gambar /
// membalik foto / flip foto (docs/keywords/flip-image-localization-2026-11-14.md).
// Facts: docs/keywords/flip-image.md, "Verified product facts". Written for Indonesian searches, not translated.
export const flipPageId: ToolPageCopy = {
  title:
    "Mirror Foto Online Gratis: Balik Foto Tanpa Turun Kualitas | Ordalin",
  description:
    "Mirror foto online: balik foto kiri-kanan atau atas-bawah, atau putar 90°, langsung di browser. JPG di-mirror tanpa dikompres ulang. Gratis, tanpa daftar.",
  h1: "Mirror Foto Online Tanpa Turun Kualitas",
  subtitle:
    "Mirror foto online: balik foto kiri-kanan atau atas-bawah, atau putar 90°, langsung di browser. JPG di-mirror tanpa dikompres ulang. Gratis, tanpa daftar.",
  sections: [
    {
      id: "how-to",
      h2: "Cara mirror foto",
      blocks: [
        {
          ol: [
            "**Tambahkan foto.** Letakkan sampai 10 file JPG, PNG, atau WebP di kotak di atas, pilih dari HP atau komputer, atau tempel screenshot dengan Ctrl+V (⌘+V di Mac).",
            "**Pilih arah mirror.** Mirror horizontal membalik kiri dan kanan; mirror vertikal membuat foto terbalik atas-bawah. Putar ke kiri dan putar ke kanan memutar foto 90°. Tombolnya bisa digabung, dan Reset mengembalikan foto ke awal.",
            "**Unduh.** Satu foto disimpan dengan format aslinya dan nama berakhiran -flipped. Beberapa foto diunduh sekaligus dalam satu file ZIP.",
          ],
        },
        {
          p: "Pratinjau menampilkan hasilnya sebelum disimpan, dan perubahan yang sama berlaku untuk semua foto yang kamu tambahkan.",
        },
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
              [
                "Apa ini",
                "Alat gratis untuk mirror foto atau gambar kiri-kanan dan atas-bawah, serta memutarnya per 90°",
              ],
              [
                "Foto yang diterima",
                "JPG, PNG, atau WebP, maksimal 10 MB dan 40 megapiksel per foto",
              ],
              ["Sekaligus", "Sampai 10 foto, diunduh dalam satu ZIP"],
              [
                "Kualitas JPG",
                "Tidak turun: data yang sudah dikompres hanya disusun ulang, tidak dikompres lagi",
              ],
              [
                "Kualitas PNG",
                "Sama persis piksel demi piksel, hanya dibalik; latar transparan tetap ada",
              ],
              [
                "Diproses di mana",
                "Di browser kamu. Foto tidak dikirim ke Ordalin atau ke pihak lain",
              ],
              ["Biaya", "Gratis, tanpa daftar, tanpa watermark"],
            ],
          },
        },
      ],
    },
    {
      id: "quality",
      h2: "Apakah mirror foto menurunkan kualitas?",
      blocks: [
        {
          p: "Tergantung formatnya dan cara alat menyimpan hasilnya. Kebanyakan alat mirror foto online menggambar ulang foto di kanvas lalu menyimpan file baru. Untuk PNG itu tidak masalah, tapi JPG jadi dikompres dua kali, dan setiap kompresi JPG menghapus sedikit detail.",
        },
        { p: "Alat ini memperlakukan tiap format secara berbeda:" },
        {
          ul: [
            "**JPG: di-mirror tanpa turun kualitas.** JPG menyimpan gambar dalam blok data terkompres berukuran 8 × 8 piksel, dan alat ini memindahkan serta membalik blok itu secara langsung, dengan cara yang sama seperti program jpegtran. Tidak ada yang didekode lalu dikompres ulang, dan profil warna serta data EXIF kamera tetap ada di file.",
            "**PNG: disimpan piksel demi piksel.** Setiap warna dan area transparan tetap sama, hanya posisinya yang dibalik.",
            "**WebP: disimpan ulang dengan kualitas tertinggi.** Piksel yang tidak transparan tidak berubah; tepi yang semi-transparan bisa sedikit bergeser. Safari tidak bisa menyimpan WebP, jadi di Safari hasilnya berupa PNG.",
          ],
        },
        {
          p: "Setiap kartu foto menampilkan apa yang terjadi pada file itu: tanpa turun kualitas, disimpan ulang, atau disimpan sebagai PNG.",
        },
      ],
    },
    {
      id: "trimmed",
      h2: "Kenapa JPG yang di-mirror bisa beberapa piksel lebih kecil",
      blocks: [
        {
          p: "Mirror JPG tanpa turun kualitas hanya bisa dilakukan per blok utuh 8 atau 16 piksel. Kalau lebar atau tinggi foto bukan kelipatan blok itu, blok terakhir yang tidak utuh tidak bisa dibalik tanpa dikompres ulang, jadi dipotong. Paling banyak 15 piksel dari satu tepi: foto 1600 × 902 yang di-mirror vertikal menjadi 1600 × 896.",
        },
        {
          p: 'Jumlah piksel yang terpotong tertulis di kartu. Kalau semua piksel penting, centang "Pertahankan semua piksel": JPG tetap berukuran penuh dan disimpan sekali dengan kualitas 95%, yang sangat sulit dibedakan dari aslinya.',
        },
      ],
    },
    {
      id: "flip-rotate-mirror",
      h2: "Mirror, flip, atau putar: apa bedanya?",
      blocks: [
        {
          table: {
            head: ["Aksi", "Yang terjadi", "Pakai saat"],
            rows: [
              [
                "**Mirror foto horizontal**",
                "Kiri dan kanan bertukar, seperti di cermin. Tulisan terbaca terbalik",
                "Foto selfie terbalik, atau desain perlu menghadap ke arah lain",
              ],
              [
                "**Mirror foto vertikal (flip)**",
                "Atas dan bawah bertukar. Foto jadi terbalik sekaligus seperti bayangan cermin",
                "Efek pantulan di air, atau hasil scan yang terbalik",
              ],
              [
                "**Putar foto 90° atau 180°**",
                "Foto berputar. Tidak ada efek cermin dan tulisan tetap terbaca normal",
                "Foto dari HP miring atau terbalik",
              ],
            ],
          },
        },
        {
          p: 'Di Indonesia, "mirror foto", "flip foto", dan "membalik foto" biasanya berarti hal yang sama: membalik foto kiri-kanan. Kalau fotonya hanya miring, putar saja, jangan di-mirror, supaya tulisan di dalamnya tidak terbaca terbalik.',
        },
      ],
    },
    {
      id: "selfie",
      h2: "Foto selfie terbalik: bagaimana memperbaikinya?",
      blocks: [
        {
          p: "Kamera depan menampilkan pratinjau yang ter-mirror, seperti cermin, karena itulah wajah yang biasa kamu lihat. Banyak HP lalu menyimpan foto seperti orang lain melihatmu, jadi selfie yang tersimpan terlihat terbalik dibanding pratinjaunya. HP lain menyimpan versi cerminnya, sehingga tulisan di kaos atau papan nama terbaca terbalik.",
        },
        {
          ul: [
            "**Untuk foto yang sudah diambil:** tambahkan selfie di sini lalu tekan Mirror horizontal.",
            "**Supaya tidak terjadi lagi di iPhone:** di Pengaturan › Kamera, nyalakan opsi cermin kamera depan (Mirror Front Camera) agar selfie disimpan seperti di pratinjau, atau matikan agar disimpan seperti dilihat orang lain.",
            "**Di Android:** pengaturan aplikasi kamera biasanya punya opsi serupa untuk menyimpan selfie sesuai pratinjau. Namanya berbeda-beda di tiap merek HP.",
          ],
        },
        {
          p: "Mirror selalu berlaku untuk seluruh foto. Kalau selfie di-mirror supaya tulisannya terbaca benar, wajahmu juga ikut terbalik. Untuk membalik tulisannya saja tanpa orangnya, kamu butuh editor yang punya fitur layer.",
        },
      ],
    },
    {
      id: "uses",
      h2: "Kapan perlu membalik foto",
      blocks: [
        {
          ul: [
            "**Sablon kaos dan kertas transfer:** desain dicetak ter-mirror supaya terbaca benar setelah disetrika ke kain. Mirror horizontal sebelum mencetak, kecuali software printernya sudah melakukannya.",
            "**Background video call:** tampilan dirimu sendiri di Zoom atau Teams biasanya ter-mirror, jadi tulisan di background terlihat terbalik bagimu tapi benar bagi orang lain. Cek dulu sebelum membaliknya.",
            "**Desain dan thumbnail:** orang yang menghadap ke luar tepi banner terasa janggal. Mirror horizontal membuatnya menghadap ke arah teks.",
            "**Hasil scan dan screenshot:** dokumen yang ter-scan dari sisi yang salah atau terbalik.",
          ],
        },
      ],
    },
    {
      id: "other-ways",
      h2: "Cara mirror foto di aplikasi lain",
      blocks: [
        {
          table: {
            head: ["Aplikasi", "Letak tombol mirror"],
            rows: [
              [
                "Foto di iPhone",
                "Edit › Pangkas (Crop) › tombol balik di pojok kiri atas (hanya horizontal)",
              ],
              [
                "Paint di Windows",
                "Image › Rotate › Flip horizontal atau Flip vertical",
              ],
              ["Preview di Mac", "Tools › Flip Horizontal atau Flip Vertical"],
              [
                "Canva",
                "Pilih gambar › Flip di toolbar › Flip horizontal atau Flip vertical",
              ],
            ],
          },
        },
        {
          p: "Aplikasi bawaan paling cepat untuk satu foto yang sudah ada di perangkat itu. Alat ini lebih cepat kalau fotonya banyak, kamu perlu mirror vertikal di HP, atau ingin JPG dibalik tanpa dikompres ulang.",
        },
      ],
    },
    {
      id: "limits",
      h2: "Cocok untuk, tidak cocok untuk",
      blocks: [
        {
          ul: [
            "**Cocok untuk:** mirror atau memutar sampai 10 foto, screenshot, atau gambar sekaligus, dengan kualitas JPG tetap terjaga.",
            "**Tidak cocok untuk:** GIF animasi atau WebP animasi, foto HEIC langsung dari iPhone (ubah dulu ke JPG), atau membalik sebagian foto saja.",
            "**Perlu diketahui:** foto di atas 10 MB atau 40 megapiksel ditolak supaya tab browser tidak kehabisan memori. JPG langka yang memakai arithmetic coding atau warna 12-bit tidak bisa dibalik tanpa turun kualitas; foto itu disimpan ulang dengan kualitas 95% dan kartunya memberi tahu.",
          ],
        },
      ],
    },
  ],
  faqHeading: "Pertanyaan umum",
  faq: [
    {
      q: "Bagaimana cara mirror foto kiri-kanan?",
      a: "Tambahkan foto, tekan Mirror horizontal, lalu unduh. Kiri dan kanan bertukar, jadi hasilnya bayangan cermin dari foto asli.",
    },
    {
      q: "Bagaimana cara membalik foto atas-bawah?",
      a: "Tekan Mirror vertikal. Kalau ingin terbalik tapi tidak seperti cermin, tekan Putar ke kanan dua kali; foto akan berputar 180°.",
    },
    {
      q: "Apakah gratis? Ada watermark?",
      a: "Gratis, tanpa daftar dan tanpa watermark, termasuk unduhan banyak foto sekaligus.",
    },
    {
      q: "Apakah foto saya diunggah?",
      a: "Tidak. Mirror dilakukan di browser pada perangkatmu sendiri; file tidak pernah dikirim ke server.",
    },
    {
      q: "Bisa mirror foto online tanpa turun kualitas?",
      a: "Bisa. JPG di sini tidak dikompres ulang, dan profil warna serta data EXIF-nya tetap ada. PNG disimpan piksel demi piksel.",
    },
    {
      q: "Apakah PNG yang di-mirror tetap transparan?",
      a: "Ya. PNG disimpan piksel demi piksel, termasuk semua area transparan dan semi-transparan.",
    },
    {
      q: "Bisa mirror banyak foto sekaligus?",
      a: "Bisa, sampai 10 foto. Semuanya dibalik dengan cara yang sama dan diunduh bersama dalam file ZIP.",
    },
    {
      q: "Bisa mirror foto tanpa membalik tulisannya?",
      a: "Tidak dengan mirror seluruh foto. Tulisan dan bagian lain ikut terbalik bersama, jadi untuk membalik sebagian saja kamu butuh editor dengan layer.",
    },
    {
      q: "Kenapa JPG saya jadi beberapa piksel lebih kecil?",
      a: 'Mirror JPG tanpa turun kualitas bekerja per blok 8 atau 16 piksel, jadi blok yang tidak utuh di satu tepi dipotong. Centang "Pertahankan semua piksel" untuk ukuran penuh dengan kualitas 95%.',
    },
    {
      q: "Bisa mirror foto di HP?",
      a: "Bisa, di browser HP modern mana pun. Ketuk kotaknya untuk memilih foto dari galeri; tombol dan pratinjau bisa dipakai dengan sentuhan.",
    },
    {
      q: "Bisa mirror GIF?",
      a: "Belum. GIF animasi dan WebP animasi belum didukung.",
    },
  ],
  closing:
    "Setelah mirror foto, butuh bentuk lain? [Crop foto bulat](/id/free-tools/circle-crop-image) untuk foto profil. Lihat juga [alat gratis untuk gambar](/id/free-tools) lainnya dan [direktori alat AI Ordalin](/) (dalam bahasa Inggris).",
};
