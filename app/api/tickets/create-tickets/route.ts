

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const authToken = request.cookies.get('auth_token')?.value;

        if (!authToken) {
            console.error('Unauthorized access: No authentication token found in cookies for create-ticket.');
            return NextResponse.json(
                { success: false, message: 'No autorizado - Token no encontrado' },
                { status: 401 },
            );
        }

        const apiUrl = 'https://app.conexmeet.live/api/v1/create-ticket';

        const formDataFromClient = await request.formData();

        const headers = new Headers();
        headers.append('Accept', 'application/json');
        headers.append('Authorization', `Bearer ${authToken}`);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers,
            body: formDataFromClient,
            redirect: 'follow',
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error(`External API error (${response.status}) creating ticket:`, errorData);
            throw new Error(
                errorData.message || `Error en API externa al crear ticket: ${response.statusText}`,
            );
        }

        const data = await response.json();

        return NextResponse.json(
            { success: true, data: data },
            { status: 200 },
        );
    } catch (error) {
        console.error('Error al crear ticket:', error);

        return NextResponse.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : 'Error desconocido al crear ticket',
            },
            { status: 500 },
        );
    }
}
