import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'No hay sesión activa' },
        { status: 401 },
      );
    }

    
    
    console.log('Usuario autenticado con Google:', session.user.email);
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Login exitoso',
        user: {
          email: session.user.email,
          name: session.user.name,
          image: session.user.image
        }
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error('[API google-login] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}