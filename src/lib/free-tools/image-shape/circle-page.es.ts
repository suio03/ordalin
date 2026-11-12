import type { ToolPageCopy } from "./page-copy";

// es: head term recortar imagen en círculo, twin recortar foto en círculo
// (docs/i18n/README.md). Neutral Spanish with tú: most volume is in Latin America.
// Facts: docs/keywords/circle-crop-image.md, "Verified product facts".
export const circlePageEs: ToolPageCopy = {
  title: "Recortar imagen en círculo gratis, con fondo transparente (PNG) | Ordalin",
  description:
    "Recorta una imagen en círculo en tu navegador: encaja la foto dentro del círculo y descarga un PNG con fondo transparente. Gratis, sin subir archivos, registro ni marca de agua.",
  h1: "Recortar imagen en círculo con fondo transparente",
  subtitle:
    "Recorta una imagen en círculo en tu navegador: encaja la foto dentro del círculo y descarga un PNG con fondo transparente. Gratis, sin subir archivos, registro ni marca de agua.",
  sections: [
    {
      id: "how-to",
      h2: "¿Cómo recortar una imagen en círculo?",
      blocks: [
        {
          ol: [
            "**Añade una foto.** Suéltala en el recuadro de arriba o toca para elegirla desde tu celular o computadora.",
            "**Coloca el círculo.** Arrastra la imagen para moverla y usa el control deslizante, la rueda del ratón o dos dedos para hacer zoom hasta que lo que quieres quede dentro del aro. Puedes alejar más allá del borde de la foto para que una toma ancha entre completa.",
            "**Elige el acabado y descarga.** Deja las esquinas transparentes o rellénalas de un color, añade un borde si quieres, elige tamaño y formato, y descarga la imagen recortada en círculo.",
          ],
        },
        { p: "Las dos vistas previas muestran el resultado sobre una página blanca y una oscura, para que veas el borde antes de descargar." },
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
              ["Qué es", "Una herramienta gratis para recortar una imagen en círculo y guardarla como archivo propio"],
              ["Fotos que acepta", "JPG, PNG o WebP, hasta 10 MB y 40 megapíxeles"],
              ["Descarga por defecto", "PNG con esquinas totalmente transparentes, al tamaño en píxeles que ocupa el círculo en tu foto"],
              ["Otros tamaños", "512, 1080 o 2048 px de diámetro; nunca más de 4096 px"],
              ["Formatos", "PNG, WebP o JPG"],
              ["Fuera del círculo", "Transparente, blanco, negro o el color que elijas"],
              ["Borde", "Aro opcional de cualquier color, del 0,5 % al 5 % del ancho"],
              ["Dónde funciona", "En tu navegador. La foto no se envía a Ordalin ni a nadie más"],
            ],
          },
        },
      ],
    },
    {
      id: "background",
      h2: "¿Esquinas transparentes o un color sólido?",
      blocks: [
        {
          p: "Una foto recortada en círculo se guarda igualmente como un archivo cuadrado. Las cuatro esquinas fuera del círculo tienen que ser algo: vacías (transparentes) o de un color. Elige según dónde vayas a usar la imagen.",
        },
        {
          ul: [
            "**Transparente** sirve para presentaciones, documentos, sitios web, stickers y logos, donde debe verse el fondo de detrás. Solo PNG y WebP pueden guardarla.",
            "**Blanco o negro** es más seguro para apps que no admiten transparencia. Algunos programas muestran las esquinas vacías como cuadros negros o blancos, y parece un error. Si el relleno coincide con la página, no se nota.",
            "**Un color propio** convierte las esquinas en un fondo intencional, por ejemplo el color de tu marca detrás de una foto del equipo.",
          ],
        },
        {
          p: "Si la plataforma ya muestra las fotos de perfil en círculo, como WhatsApp, Instagram o LinkedIn, ella misma recorta el cuadrado y las esquinas nunca se ven. Aun así conviene recortar antes: decides tú qué queda dentro del aro en lugar de dejar que la plataforma adivine.",
        },
      ],
    },
    {
      id: "sharp",
      h2: "Cómo mantener nítido el recorte circular",
      blocks: [
        {
          p: "Un círculo borroso casi siempre sale de agrandar la imagen más de lo que la foto realmente tiene. El menú de tamaño indica cuántos píxeles cubre el círculo en tu foto, y «Original» conserva exactamente esa cifra, sin estirar nada.",
        },
        {
          ul: [
            "Parte de la foto original, no de una captura de pantalla ni de una imagen guardada de un chat, que suelen estar reducidas.",
            "Cuanto más acercas, menos píxeles reales cubre el círculo. Si el tamaño original queda por debajo de lo que necesitas, aleja el recorte o usa una foto más grande.",
            "Si eliges un tamaño mayor que el que cubre el círculo, la herramienta te avisa de que la imagen se ampliará y se verá menos nítida.",
            "Usa PNG para logos, texto y colores planos. JPG va bien para fotos con fondo de color y pesa menos.",
          ],
        },
      ],
    },
    {
      id: "uses",
      h2: "Para qué se recorta una foto en círculo",
      blocks: [
        {
          ul: [
            "**Fotos de perfil:** una foto redonda para WhatsApp, Discord, Slack o un foro, centrada en tu cara y no donde decida la plataforma.",
            "**Logos e insignias:** un recorte circular con borde y esquinas transparentes, listo para un sitio web, una diapositiva o una foto de producto.",
            "**Páginas de equipo o ponentes:** el mismo círculo para todos los retratos, para que una fila de caras quede alineada.",
            "**Presentaciones y documentos:** fotos redondas que quedan bien sobre cualquier fondo, sin un recuadro blanco alrededor.",
          ],
        },
      ],
    },
    {
      id: "other-ways",
      h2: "Otras formas de recortar una foto en círculo",
      blocks: [
        {
          table: {
            head: ["Método", "Ideal cuando", "No tan bien cuando"],
            rows: [
              [
                "Una herramienta en el navegador como esta",
                "Quieres un archivo redondo aparte, transparente o con color, desde cualquier dispositivo",
                "Necesitas editar muchas imágenes a la vez (esta herramienta trabaja de una en una)",
              ],
              [
                "PowerPoint o Word: Formato de imagen › Recortar › Recortar a la forma › Elipse",
                "El círculo solo tiene que verse dentro de esa diapositiva o documento",
                "Necesitas el círculo como archivo; debajo de la forma la foto sigue siendo un rectángulo",
              ],
              [
                "Presentaciones de Google: flecha junto a Recortar › Máscara de imagen › Formas › Elipse",
                "Ya estás armando la presentación en Google",
                "La foto no es cuadrada: la máscara queda ovalada hasta que la recortas en cuadrado",
              ],
              [
                "Apps de diseño con marcos circulares",
                "El círculo forma parte de un diseño más grande",
                "Solo necesitas un archivo redondo y no quieres crear una cuenta ni pagar para exportar con transparencia",
              ],
              [
                "Fotos del iPhone",
                "Basta con un recorte cuadrado, porque la app donde publicas lo redondea",
                "Necesitas un círculo de verdad: Fotos recorta como mucho en cuadrado",
              ],
            ],
          },
        },
      ],
    },
    {
      id: "limits",
      h2: "Para qué sirve y para qué no",
      blocks: [
        {
          ul: [
            "**Sirve para:** recortar una imagen en círculo cada vez, con un resultado limpio que puedes usar en cualquier sitio.",
            "**No sirve para:** otras formas, óvalos o muchas fotos de una vez. No acepta fotos HEIC del iPhone; conviértelas antes a JPG.",
            "**Antes de empezar:** se rechazan imágenes de más de 10 MB o 40 megapíxeles para que la pestaña no se quede sin memoria. Reduce primero los archivos enormes de cámara.",
          ],
        },
      ],
    },
  ],
  faqHeading: "Preguntas frecuentes",
  faq: [
    {
      q: "¿Es gratis recortar una imagen en círculo aquí?",
      a: "Sí. No hay registro, marca de agua ni plan de pago, y la descarga en PNG transparente está incluida.",
    },
    {
      q: "¿Cómo recorto una imagen en círculo con fondo transparente?",
      a: "Deja «Fuera del círculo» en Transparente y descarga en PNG o WebP. Todo lo que queda fuera del aro se guarda como píxeles vacíos, así que deja ver lo que haya detrás.",
    },
    {
      q: "¿Por qué las esquinas de mi círculo salen blancas o negras?",
      a: "O el archivo se guardó en JPG, que no admite transparencia, o la app donde lo abres pinta los píxeles vacíos de un color. Descarga un PNG o rellena las esquinas con el color de la página donde irá.",
    },
    {
      q: "¿Se suben mis fotos?",
      a: "No. Tu navegador lee, recorta y guarda la foto en tu dispositivo. No se envía nada a un servidor, así que también sirve para fotos privadas.",
    },
    {
      q: "¿Puedo ponerle un borde al círculo?",
      a: "Sí. Mueve el control del borde para elegir el grosor y escoge un color. El aro se dibuja por dentro del círculo, así que nunca queda cortado.",
    },
    {
      q: "¿De qué tamaño debe ser una foto de perfil redonda?",
      a: "Las fotos de perfil se muestran pequeñas, así que 512 o 1080 px de diámetro bastan para la mayoría de sitios. Deja «Original» si quieres todo el detalle que tiene la foto.",
    },
    {
      q: "¿Funciona en iPhone y Android?",
      a: "Sí, en el navegador del celular. Arrastra con un dedo, pellizca con dos para hacer zoom y descarga a tus fotos o archivos.",
    },
    {
      q: "¿Puedo recortar en círculo una foto horizontal o vertical?",
      a: "Sí. Mueve el círculo sobre cualquier parte o aleja hasta que toda la foto entre en el aro; el espacio vacío alrededor toma el fondo que elijas.",
    },
    {
      q: "¿En qué formatos puedo descargar?",
      a: "PNG, WebP y JPG. PNG y WebP mantienen las esquinas transparentes; JPG las rellena de blanco salvo que elijas un color.",
    },
    {
      q: "¿Puedo usar el resultado con fines comerciales?",
      a: "Ordalin no añade nada a la imagen ni reclama derechos sobre ella. Que puedas usarla comercialmente depende de quién tenga los derechos de la foto original.",
    },
  ],
  closing:
    "¿Prefieres la foto completa en cuadrado en lugar de un círculo? Usa [Square an image](/free-tools/square-an-image) (en inglés) para hacerla cuadrada sin recortarla. Hay más [herramientas gratis](/free-tools) y el [directorio de herramientas de IA de Ordalin](/), ambos en inglés.",
};
