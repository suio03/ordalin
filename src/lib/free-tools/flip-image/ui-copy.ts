import type { Locale } from "@/lib/free-tools/i18n";
import { en, type FlipCopy } from "./copy";

// Flip tool UI strings per locale. English (copy.ts) defines the type.

const ja: FlipCopy = {
  name: "画像を反転",
  drop: {
    title: "ここに画像をドロップ",
    action: "またはファイルを選択",
    paste: "スクリーンショットは {key}+V で貼り付けることもできます。",
    limits:
      "JPG・PNG・WebP。最大 {files} 枚、1枚 {mb}MB まで。画像はアップロードされません。",
  },
  errors: {
    type: "{name}：JPG・PNG・WebP の画像ではありません。",
    bytes: "{name}：{mb}MB を超えています。",
    pixels:
      "{name}：{mp} メガピクセルで、上限の {max}MP を超えています。先に縮小してください。",
    decode: "{name}：開けませんでした。ファイルが壊れている可能性があります。",
    tooMany: "最初の {files} 枚だけを追加しました。",
    export: "{name}：ダウンロード用のファイルを作れませんでした。",
  },
  controls: {
    label: "反転と回転",
    flipH: "左右反転",
    flipV: "上下反転",
    rotateLeft: "左に回転",
    rotateRight: "右に回転",
    reset: "リセット",
  },
  state: {
    none: "まだ変更していません。反転か回転を選んでください。",
    flipH: "左右反転（左 ↔ 右）",
    flipV: "上下反転（上下さかさま）",
    rotate180: "180°回転",
    rotateCW: "右に90°回転",
    rotateCCW: "左に90°回転",
    transpose: "右に90°回転して左右反転",
    transverse: "左に90°回転して左右反転",
  },
  list: {
    remove: "{name} を削除",
    lossless: "劣化なし（再圧縮なし）",
    trimmed: "端を {n}px カット",
    reencoded: "画質 95% で再保存",
    pngOut: "PNG で保存（このブラウザは WebP を保存できません）",
    size: "{w} × {h}",
  },
  output: {
    download: "ダウンロード",
    downloadZip: "すべて（{n} 枚）を ZIP でダウンロード",
    working: "準備中…",
    add: "画像を追加",
    clear: "すべて消去",
    keepExact: "ピクセルを1つも削らない（JPG を画質 95% で再保存）",
    keepExactHint:
      "JPG の劣化なし反転は 8 か 16px のブロック単位なので、片側の端が最大 15px カットされることがあります。",
  },
};

const es: FlipCopy = {
  name: "Voltear imagen",
  drop: {
    title: "Suelta las imágenes aquí",
    action: "o elige archivos",
    paste: "También puedes pegar una captura con {key}+V.",
    limits:
      "JPG, PNG o WebP. Hasta {files} imágenes de {mb} MB cada una. No se sube nada.",
  },
  errors: {
    type: "{name}: no es una imagen JPG, PNG o WebP.",
    bytes: "{name}: pesa más de {mb} MB.",
    pixels:
      "{name}: tiene {mp} megapíxeles y el límite es {max} MP. Redúcela primero.",
    decode: "{name}: no se pudo abrir. Puede estar dañada.",
    tooMany: "Solo se añadieron las primeras {files} imágenes.",
    export: "{name}: no se pudo crear la descarga.",
  },
  controls: {
    label: "Voltear y girar",
    flipH: "Voltear horizontal",
    flipV: "Voltear vertical",
    rotateLeft: "Girar a la izquierda",
    rotateRight: "Girar a la derecha",
    reset: "Restablecer",
  },
  state: {
    none: "Sin cambios todavía. Elige cómo voltear o girar.",
    flipH: "Volteada en horizontal (izquierda ↔ derecha)",
    flipV: "Volteada en vertical (de cabeza)",
    rotate180: "Girada 180°",
    rotateCW: "Girada 90° a la derecha",
    rotateCCW: "Girada 90° a la izquierda",
    transpose: "Girada 90° a la derecha y volteada en horizontal",
    transverse: "Girada 90° a la izquierda y volteada en horizontal",
  },
  list: {
    remove: "Quitar {name}",
    lossless: "Sin pérdida, sin recomprimir",
    trimmed: "{n} px recortados del borde",
    reencoded: "Guardada de nuevo al 95% de calidad",
    pngOut: "Guardada como PNG (este navegador no guarda WebP)",
    size: "{w} × {h}",
  },
  output: {
    download: "Descargar",
    downloadZip: "Descargar todas ({n}) en ZIP",
    working: "Preparando…",
    add: "Añadir imágenes",
    clear: "Quitar todas",
    keepExact:
      "Conservar todos los píxeles (guarda el JPG de nuevo al 95% de calidad)",
    keepExactHint:
      "Voltear un JPG sin pérdida funciona en bloques de 8 o 16 px, así que se pueden recortar hasta 15 px de un borde.",
  },
};

const id: FlipCopy = {
  name: "Mirror foto",
  drop: {
    title: "Letakkan gambar di sini",
    action: "atau pilih file",
    paste: "Kamu juga bisa menempelkan screenshot dengan {key}+V.",
    limits:
      "JPG, PNG, atau WebP. Maksimal {files} gambar, masing-masing {mb} MB. Tidak ada yang diunggah.",
  },
  errors: {
    type: "{name}: bukan gambar JPG, PNG, atau WebP.",
    bytes: "{name}: lebih dari {mb} MB.",
    pixels: "{name}: {mp} megapiksel, melebihi batas {max} MP. Perkecil dulu.",
    decode: "{name}: tidak bisa dibuka. Mungkin filenya rusak.",
    tooMany: "Hanya {files} gambar pertama yang ditambahkan.",
    export: "{name}: file unduhan tidak bisa dibuat.",
  },
  controls: {
    label: "Mirror dan putar",
    flipH: "Mirror horizontal",
    flipV: "Mirror vertikal",
    rotateLeft: "Putar ke kiri",
    rotateRight: "Putar ke kanan",
    reset: "Reset",
  },
  state: {
    none: "Belum diubah. Pilih mirror atau putar.",
    flipH: "Di-mirror horizontal (kiri ↔ kanan)",
    flipV: "Di-mirror vertikal (terbalik atas-bawah)",
    rotate180: "Diputar 180°",
    rotateCW: "Diputar 90° ke kanan",
    rotateCCW: "Diputar 90° ke kiri",
    transpose: "Diputar 90° ke kanan lalu di-mirror horizontal",
    transverse: "Diputar 90° ke kiri lalu di-mirror horizontal",
  },
  list: {
    remove: "Hapus {name}",
    lossless: "Tanpa turun kualitas, tidak dikompres ulang",
    trimmed: "Tepi terpotong {n} px",
    reencoded: "Disimpan ulang dengan kualitas 95%",
    pngOut: "Disimpan sebagai PNG (browser ini tidak bisa menyimpan WebP)",
    size: "{w} × {h}",
  },
  output: {
    download: "Unduh",
    downloadZip: "Unduh semua ({n}) sebagai ZIP",
    working: "Menyiapkan…",
    add: "Tambah gambar",
    clear: "Hapus semua",
    keepExact:
      "Pertahankan semua piksel (JPG disimpan ulang dengan kualitas 95%)",
    keepExactHint:
      "Mirror JPG tanpa turun kualitas bekerja per blok 8 atau 16 px, jadi tepi di satu sisi bisa terpotong maksimal 15 px.",
  },
};

export const flipUiCopy: Record<Locale, FlipCopy> = { en, ja, es, id };
