import { NextRequest, NextResponse } from 'next/server';

const DEEPL_API_URL =
  process.env.DEEPL_API_URL || 'https://api-free.deepl.com/v2/translate';
const DEEPL_API_KEY = process.env.DEEPL_API_KEY;

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

    const detectResponse = await fetch(DEEPL_API_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        text: [text],
        target_lang: 'EN',
      }),
    });

    if (!detectResponse.ok) {
      const errorData = await detectResponse
        .json()
        .catch(() => ({ message: 'Error desconocido de DeepL (detección).' }));
      console.error('Error de DeepL (detección):', errorData);
      return NextResponse.json(
        {
          error: 'Error al detectar idioma con DeepL',
          details: errorData.message || 'Respuesta no exitosa',
        },
        { status: detectResponse.status || 500 },
      );
    }

    const detectResult = await detectResponse.json();
    const detectedLang = detectResult.translations[0]?.detected_source_language;

    if (!detectedLang) {
      return NextResponse.json(
        { error: 'No se pudo detectar el idioma del texto.' },
        { status: 422 },
      );
    }

    const targetLang = detectedLang === 'ES' ? 'EN' : 'ES';

    const translateResponse = await fetch(DEEPL_API_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        text: [text],
        target_lang: targetLang,
      }),
    });

    if (!translateResponse.ok) {
      const errorData = await translateResponse
        .json()
        .catch(() => ({ message: 'Error desconocido de DeepL (traducción).' }));
      return NextResponse.json(
        {
          error: 'Error al traducir el texto con DeepL',
          details: errorData.message || 'Respuesta no exitosa',
        },
        { status: translateResponse.status || 500 },
      );
    }

    const translateResult = await translateResponse.json();
    const translatedText = translateResult.translations[0]?.text;

    if (!translatedText) {
      return NextResponse.json(
        { error: 'La traducción no fue recibida o está vacía.' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      originalText: text,
      translatedText: translatedText,
      detectedSourceLanguage: detectedLang,
      targetLanguage: targetLang,
    });
  } catch (error: any) {
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
