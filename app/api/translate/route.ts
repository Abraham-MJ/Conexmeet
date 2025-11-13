import { NextRequest, NextResponse } from 'next/server';

const DEEPL_TRANSLATE_URL = 'https://api-free.deepl.com/v2/translate';
const DEEPL_API_KEY = '2d9421c7-6aef-25e5-96ac-86e601c07928:fx';

export async function POST(request: NextRequest) {
  try {
    if (!DEEPL_API_KEY) {
      return NextResponse.json(
        {
          error:
            'Error de configuración del servicio de traducción: Clave no encontrada.',
        },
        { status: 500 },
      );
    }

    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'El texto es obligatorio y debe ser una cadena de texto.' },
        { status: 400 },
      );
    }

    const headers = {
      Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
      'Content-Type': 'application/json',
    };


    const toSpanishResponse = await fetch(DEEPL_TRANSLATE_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        text: [text],
        target_lang: 'ES',
      }),
    });

    if (!toSpanishResponse.ok) {
      const errorData = await toSpanishResponse
        .json()
        .catch(() => ({ message: 'Error desconocido de DeepL.' }));
      console.error('[Translate API] ❌ Error de DeepL:', errorData);
      return NextResponse.json(
        {
          error: 'Error al procesar con DeepL',
          details: errorData.message || 'Respuesta no exitosa',
        },
        { status: toSpanishResponse.status || 500 },
      );
    }

    const toSpanishResult = await toSpanishResponse.json();
    const detectedLang =
      toSpanishResult.translations[0]?.detected_source_language;
    const spanishTranslation = toSpanishResult.translations[0]?.text;


    if (!detectedLang) {
      return NextResponse.json(
        { error: 'No se pudo detectar el idioma del texto.' },
        { status: 422 },
      );
    }

    let targetLang: string;
    let translatedText: string;
    let finalDetectedLang: string;

    const normalizeText = (str: string) =>
      str.toLowerCase().replace(/[.,!?¿¡\s]+/g, '');

    const isTextUnchanged =
      normalizeText(text) === normalizeText(spanishTranslation);

  

    if (isTextUnchanged) {
      targetLang = 'EN-US';
      finalDetectedLang = 'ES';

   

      const toEnglishResponse = await fetch(DEEPL_TRANSLATE_URL, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          text: [text],
          target_lang: targetLang,
        }),
      });

      if (!toEnglishResponse.ok) {
        const errorData = await toEnglishResponse.json().catch(() => ({
          message: 'Error desconocido de DeepL (traducción).',
        }));
        console.error(
          '[Translate API] ❌ Error de DeepL (traducción):',
          errorData,
        );
        return NextResponse.json(
          {
            error: 'Error al traducir el texto con DeepL',
            details: errorData.message || 'Respuesta no exitosa',
          },
          { status: toEnglishResponse.status || 500 },
        );
      }

      const toEnglishResult = await toEnglishResponse.json();

    
      translatedText = toEnglishResult.translations[0]?.text;


    } else {
      targetLang = 'ES';
      translatedText = spanishTranslation;
      finalDetectedLang = detectedLang;

    
    
    }

    if (!translatedText) {
      console.error('[Translate API] ❌ La traducción está vacía');
      return NextResponse.json(
        { error: 'La traducción no fue recibida o está vacía.' },
        { status: 500 },
      );
    }

  

    return NextResponse.json({
      originalText: text,
      translatedText: translatedText,
      detectedSourceLanguage: finalDetectedLang,
      targetLanguage: targetLang,
    });
  } catch (error: any) {
    console.error('[Translate API] Error:', error);
    return NextResponse.json(
      {
        error:
          'Error interno del servidor al procesar la solicitud de traducción.',
        details: error.message,
      },
      { status: 500 },
    );
  }
}
