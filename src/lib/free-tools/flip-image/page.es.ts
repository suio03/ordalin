import type { ToolPageCopy } from "@/lib/free-tools/image-shape/page-copy";

// es: head term voltear imagen (MX 880), twin invertir imagen (MX 720, ES 590); espejo variants
// (docs/keywords/flip-image-localization-2026-11-14.md). MX and ES SERPs are flip-tool intent.
// Facts: docs/keywords/flip-image.md, "Verified product facts". Written for Spanish searches, not translated.
export const flipPageEs: ToolPageCopy = {
  title:
    "Voltear imagen online gratis: invertir imagen sin perder calidad | Ordalin",
  description:
    "Voltea una imagen online: inviértela en espejo de izquierda a derecha o de arriba abajo, o gírala 90°, en tu navegador. Los JPG se voltean sin perder calidad. Gratis y sin registro.",
  h1: "Voltear imagen online sin perder calidad",
  subtitle:
    "Voltea una imagen online: inviértela en espejo de izquierda a derecha o de arriba abajo, o gírala 90°, en tu navegador. Los JPG se voltean sin perder calidad. Gratis y sin registro.",
  sections: [
    {
      id: "how-to",
      h2: "¿Cómo voltear una imagen?",
      blocks: [
        {
          ol: [
            "**Añade tus imágenes.** Suelta hasta 10 archivos JPG, PNG o WebP en el recuadro de arriba, elígelos desde tu celular o computadora, o pega una captura con Ctrl+V (⌘+V en Mac).",
            "**Elige cómo voltearla.** Voltear horizontal cambia izquierda por derecha; voltear vertical pone la imagen de cabeza. Girar a la izquierda o a la derecha la rota 90°. Puedes combinar los botones o pulsar Restablecer para empezar de nuevo.",
            "**Descarga.** Una sola imagen se guarda con su formato original y el nombre terminado en -flipped. Varias imágenes se descargan juntas en un ZIP.",
          ],
        },
        {
          p: "La vista previa muestra el resultado antes de guardar, y el mismo cambio se aplica a todas las imágenes que añadiste.",
        },
      ],
    },
    {
      id: "facts",
      h2: "Datos rápidos",
      blocks: [
        {
          table: {
            head: ["", ""],
            rows: [
              [
                "Qué es",
                "Una herramienta gratis para voltear una imagen o invertirla en espejo, de lado o de arriba abajo, y girarla de 90° en 90°",
              ],
              [
                "Imágenes que acepta",
                "JPG, PNG o WebP, hasta 10 MB y 40 megapíxeles cada una",
              ],
              [
                "Varias a la vez",
                "Hasta 10 imágenes, descargadas en un solo ZIP",
              ],
              [
                "Calidad del JPG",
                "Sin pérdida: los datos comprimidos se reordenan, no se vuelven a comprimir",
              ],
              [
                "Calidad del PNG",
                "Idéntico píxel por píxel, solo invertido; la transparencia se conserva",
              ],
              [
                "Dónde funciona",
                "En tu navegador. Las imágenes no se envían a Ordalin ni a nadie más",
              ],
              ["Precio", "Gratis, sin registro y sin marca de agua"],
            ],
          },
        },
      ],
    },
    {
      id: "quality",
      h2: "¿Voltear una imagen le quita calidad?",
      blocks: [
        {
          p: "Depende del formato y de cómo se guarda el resultado. La mayoría de las herramientas para invertir una imagen online la dibujan en un lienzo y guardan un archivo nuevo. Con PNG no pasa nada, pero un JPG se comprime otra vez, y cada compresión borra un poco más de detalle.",
        },
        { p: "Esta herramienta trata cada formato de forma distinta:" },
        {
          ul: [
            "**JPG: se voltea sin pérdida.** Un JPG guarda la imagen en bloques comprimidos de 8 × 8 píxeles, y la herramienta mueve e invierte esos bloques directamente, con el mismo método que el programa jpegtran. No se descomprime ni se vuelve a comprimir nada, y el perfil de color y los datos EXIF de la cámara se quedan en el archivo.",
            "**PNG: se guarda píxel por píxel.** Cada color y cada zona transparente quedan exactamente igual, solo en espejo.",
            "**WebP: se guarda de nuevo a la máxima calidad.** Los píxeles opacos no cambian; los bordes semitransparentes pueden variar muy poco. Safari no puede guardar WebP, así que en Safari el resultado sale como PNG.",
          ],
        },
        {
          p: "Cada tarjeta de imagen indica qué pasó con ese archivo: sin pérdida, guardada de nuevo o guardada como PNG.",
        },
      ],
    },
    {
      id: "trimmed",
      h2: "Por qué un JPG volteado puede quedar unos píxeles más chico",
      blocks: [
        {
          p: "Voltear un JPG sin pérdida solo funciona con bloques completos de 8 o 16 píxeles. Si el ancho o el alto no es múltiplo de ese bloque, el último bloque incompleto no se puede invertir sin volver a comprimirlo, así que se recorta. Son como máximo 15 píxeles de un borde: una foto de 1600 × 902 volteada en vertical queda de 1600 × 896.",
        },
        {
          p: "La tarjeta muestra cuántos píxeles se recortaron. Si necesitas todos, marca «Conservar todos los píxeles»: el JPG mantiene su tamaño completo y se guarda una sola vez al 95% de calidad, algo muy difícil de distinguir del original.",
        },
      ],
    },
    {
      id: "flip-rotate-mirror",
      h2: "Voltear, girar o hacer espejo: ¿cuál es la diferencia?",
      blocks: [
        {
          table: {
            head: ["Acción", "Qué pasa", "Úsala cuando"],
            rows: [
              [
                "**Voltear imagen en horizontal**",
                "Izquierda y derecha se intercambian, como en un espejo. El texto se lee al revés",
                "Una selfie salió invertida o un diseño debe mirar hacia el otro lado",
              ],
              [
                "**Voltear imagen en vertical**",
                "Arriba y abajo se intercambian. La imagen queda de cabeza y en espejo",
                "Reflejos en el agua, o un escaneo que salió de cabeza y al revés",
              ],
              [
                "**Girar imagen 90° o 180°**",
                "La imagen rota. No hay espejo y el texto se sigue leyendo bien",
                "Una foto del celular quedó de lado o de cabeza",
              ],
            ],
          },
        },
        {
          p: "Cuando alguien busca una «imagen en espejo» o un «efecto espejo» en una foto, casi siempre quiere voltearla en horizontal. Si la foto solo está de lado, gírala en lugar de voltearla, o el texto que aparezca quedará al revés.",
        },
      ],
    },
    {
      id: "selfie",
      h2: "Mi selfie salió al revés: ¿cómo la arreglo?",
      blocks: [
        {
          p: "La cámara frontal te muestra una vista previa en espejo, porque es la cara que estás acostumbrado a ver. Muchos teléfonos guardan después la foto como te ven los demás, así que la selfie guardada parece invertida comparada con la vista previa. Otros guardan la versión en espejo, y entonces las letras de una playera o de un letrero se leen al revés.",
        },
        {
          ul: [
            "**Para arreglar una que ya tomaste:** añádela aquí y pulsa Voltear horizontal.",
            "**Para que no vuelva a pasar en iPhone:** en Ajustes › Cámara, activa la opción de espejo de la cámara frontal para guardar las selfies como en la vista previa, o desactívala para guardarlas como te ven los demás.",
            "**En Android:** los ajustes de la app de cámara suelen tener una opción parecida para guardar las selfies como se ven en la vista previa. El nombre cambia según la marca.",
          ],
        },
        {
          p: "Voltear siempre afecta a toda la imagen. Si inviertes una selfie para que el texto se lea bien, tu cara también queda en espejo. Para invertir solo el texto y no a la persona hace falta un editor con capas.",
        },
      ],
    },
    {
      id: "uses",
      h2: "Cuándo hace falta invertir una imagen",
      blocks: [
        {
          ul: [
            "**Transfers para planchar y playeras:** el diseño se imprime en espejo para que se lea bien una vez planchado en la tela. Inviértelo en horizontal antes de imprimir, salvo que el programa de la impresora ya lo haga.",
            "**Fondos para videollamadas:** tu propia vista en Zoom o Teams suele verse en espejo, así que el texto de un fondo te parece al revés pero los demás lo ven bien. Compruébalo antes de voltearlo.",
            "**Diseños y miniaturas:** una persona que mira hacia fuera del borde de un banner se ve rara. Al voltearla en horizontal queda mirando hacia el texto.",
            "**Escaneos y capturas:** documentos escaneados del lado equivocado o de cabeza.",
          ],
        },
      ],
    },
    {
      id: "other-ways",
      h2: "Cómo voltear una imagen en otras apps",
      blocks: [
        {
          table: {
            head: ["App", "Dónde está la opción"],
            rows: [
              [
                "Fotos del iPhone",
                "Editar › Recortar › el botón de voltear arriba a la izquierda (solo horizontal)",
              ],
              [
                "Paint en Windows",
                "Imagen › Girar › Voltear horizontalmente o Voltear verticalmente",
              ],
              [
                "Vista Previa en Mac",
                "Herramientas › Voltear horizontalmente o Voltear verticalmente",
              ],
              [
                "Canva",
                "Selecciona la imagen › Voltear en la barra › Voltear horizontalmente o Voltear verticalmente",
              ],
              [
                "Documentos de Google",
                "Las imágenes pegadas no se pueden voltear: insértala con Insertar › Dibujo › Nuevo y luego usa Acciones › Girar › Voltear horizontalmente",
              ],
            ],
          },
        },
        {
          p: "Las apps del sistema son lo más rápido para una sola foto que ya está en ese equipo. Esta herramienta es más rápida cuando tienes varias imágenes, necesitas voltear en vertical desde el celular o quieres invertir un JPG sin volver a comprimirlo.",
        },
      ],
    },
    {
      id: "limits",
      h2: "Sirve para, no sirve para",
      blocks: [
        {
          ul: [
            "**Sirve para:** voltear o girar hasta 10 fotos, capturas o gráficos a la vez, manteniendo la calidad del JPG.",
            "**No sirve para:** GIF animados o WebP animados, fotos HEIC tal como salen del iPhone (conviértelas antes a JPG), invertir solo una parte de la imagen ni invertir los colores.",
            "**Antes de empezar:** se rechazan las imágenes de más de 10 MB o 40 megapíxeles para que la pestaña del navegador no se quede sin memoria. Algunos JPG poco comunes con codificación aritmética o color de 12 bits no se pueden voltear sin pérdida; se guardan de nuevo al 95% de calidad y la tarjeta lo indica.",
          ],
        },
      ],
    },
  ],
  faqHeading: "Preguntas frecuentes",
  faq: [
    {
      q: "¿Cómo volteo una imagen en horizontal?",
      a: "Añade la imagen, pulsa Voltear horizontal y descárgala. Izquierda y derecha se intercambian, así que obtienes la imagen en espejo.",
    },
    {
      q: "¿Cómo pongo una foto de cabeza?",
      a: "Pulsa Voltear vertical. Si la quieres de cabeza pero sin espejo, pulsa dos veces Girar a la derecha: así gira 180°.",
    },
    {
      q: "¿Es gratis? ¿Pone marca de agua?",
      a: "Es gratis, sin registro y sin marca de agua, y la descarga de varias imágenes también está incluida.",
    },
    {
      q: "¿Se suben mis imágenes?",
      a: "No. Todo ocurre en el navegador de tu propio dispositivo; los archivos nunca se envían a un servidor.",
    },
    {
      q: "¿Cómo invertir una imagen sin perder calidad?",
      a: "Usa una herramienta que voltee los JPG sin pérdida, como esta, y deja los PNG como PNG. Un JPG volteado aquí no se vuelve a comprimir y conserva su perfil de color y sus datos EXIF.",
    },
    {
      q: "¿Un PNG volteado conserva el fondo transparente?",
      a: "Sí. Los PNG se guardan píxel por píxel, con todas sus zonas transparentes y semitransparentes.",
    },
    {
      q: "¿Puedo voltear varias imágenes a la vez?",
      a: "Sí, hasta 10. Todas reciben el mismo cambio y se descargan juntas en un ZIP.",
    },
    {
      q: "¿Puedo voltear una imagen sin que se invierta el texto?",
      a: "No con un volteo de toda la imagen. El texto y todo lo demás se invierten juntos; para voltear solo una parte necesitas un editor con capas.",
    },
    {
      q: "¿Por qué mi JPG volteado tiene unos píxeles menos?",
      a: "Voltear un JPG sin pérdida funciona en bloques de 8 o 16 píxeles, así que se recorta un bloque incompleto de un borde. Marca «Conservar todos los píxeles» para mantener el tamaño completo al 95% de calidad.",
    },
    {
      q: "¿Puedo voltear una imagen desde el celular?",
      a: "Sí, en cualquier navegador móvil actual. Toca el recuadro para elegir fotos de tu galería; los botones y la vista previa funcionan con el dedo.",
    },
    {
      q: "¿Puedo invertir los colores de una imagen?",
      a: "No. Esta herramienta voltea la imagen en espejo o de arriba abajo; los colores no cambian.",
    },
  ],
  closing:
    "¿Además de voltearla necesitas otra forma? [Recorta la imagen en círculo](/es/free-tools/circle-crop-image) para usarla como foto de perfil. Hay más [herramientas gratis para imágenes](/es/free-tools) y el [directorio de herramientas de IA de Ordalin](/) (en inglés).",
};
