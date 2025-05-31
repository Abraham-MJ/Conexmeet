import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const historyId = searchParams.get('historyId');
  
  try {

    if (!historyId) {
      return NextResponse.json(
        {
          success: false,
          message: 'El ID del historial es requerido en la URL.',
        },
        { status: 400 },
      );
    }

    const authToken = request.cookies.get('auth_token')?.value;
    if (!authToken) {
      return NextResponse.json(
        { success: false, message: 'Token de autenticación no encontrado.' },
        { status: 401 },
      );
    }

    const response = await fetch(
      `https://app.conexmeet.live/api/v1/histories/${historyId}`,
      {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      },
    );

    let apiResponseMessage: string | null = null;

    if (response.status === 204) {
      apiResponseMessage = 'Recurso eliminado exitosamente.';
    } else {
      try {
        const externalApiResponse = await response.json();
        apiResponseMessage =
          externalApiResponse.message ||
          (response.ok
            ? 'Operación completada.'
            : 'Error desde el servicio externo.');
      } catch {
        const textResponse = await response.text();
        apiResponseMessage =
          textResponse ||
          (response.ok
            ? 'Operación completada.'
            : `Error del servicio externo: ${response.status}`);
      }
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            apiResponseMessage ||
            `Error al eliminar el historial (código: ${response.status}).`,
        },
        { status: response.status },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: apiResponseMessage || 'Historial eliminado exitosamente.',
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error(
      `Error en la ruta API DELETE /api/histories/${historyId}:`,
      error instanceof Error ? error.message : error,
    );

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Respuesta con formato inesperado del servicio externo.',
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          'Error interno del servidor. Por favor, inténtelo de nuevo más tarde.',
      },
      { status: 500 },
    );
  }
}
