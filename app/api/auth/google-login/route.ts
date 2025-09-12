import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json(
      { success: false, message: 'Google login no implementado aún' },
      { status: 501 },
    );
  } catch (error: any) {
    console.error('[API google-login] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}