import { NextRequest, NextResponse } from 'next/server';

interface RoomData {
    id: number;
    host_id: string;
    user_id: number;
    another_user_id: number | null;
    status: string;
}

// Cache temporal para prevenir conexiones simultáneas
const connectionAttempts = new Map<string, { userId: number; timestamp: number; locked: boolean }>();
const LOCK_TIMEOUT = 10000; // 10 segundos

// Limpiar intentos expirados cada 30 segundos
setInterval(() => {
    const now = Date.now();
    for (const [hostId, attempt] of connectionAttempts.entries()) {
        if (now - attempt.timestamp > LOCK_TIMEOUT) {
            connectionAttempts.delete(hostId);
        }
    }
}, 30000);

export async function POST(request: NextRequest) {
    let targetHostId: string | undefined;

    try {
        const body = await request.json();
        const { user_id: maleUserId, host_id: hostId } = body;
        targetHostId = hostId;

        const authToken = request.cookies.get('auth_token')?.value;

        if (!authToken) {
            return NextResponse.json(
                { success: false, message: 'No autorizado. Token no encontrado.' },
                { status: 401 },
            );
        }

        if (!maleUserId || !targetHostId) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'El user_id y host_id son requeridos.'
                },
                { status: 400 },
            );
        }

        // CAPA 1: Verificar si ya hay un intento de conexión en progreso
        const existingAttempt = connectionAttempts.get(targetHostId);
        const now = Date.now();

        if (existingAttempt) {
            // Si el intento no ha expirado y es de otro usuario
            if (now - existingAttempt.timestamp < LOCK_TIMEOUT && existingAttempt.userId !== maleUserId) {
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Otro usuario está intentando conectarse a este canal. Intenta con otro.',
                    },
                    { status: 409 },
                );
            }

            // Si es el mismo usuario, permitir (posible reconexión)
            if (existingAttempt.userId === maleUserId) {
                existingAttempt.timestamp = now;
                existingAttempt.locked = true;
            }
        } else {
            // Registrar nuevo intento de conexión
            connectionAttempts.set(targetHostId, {
                userId: maleUserId,
                timestamp: now,
                locked: true
            });
        }

        try {
            // CAPA 2: Verificación inmediata del estado del canal
            const listRoomsApiUrl = `https://app.conexmeet.live/api/v1/rooms?filter[status]=waiting&filter[host_id]=${targetHostId}`;
            const roomsListResponse = await fetch(listRoomsApiUrl, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${authToken}`,
                },
            });

            if (!roomsListResponse.ok) {
                throw new Error(`Error al verificar disponibilidad: ${roomsListResponse.status}`);
            }

            const roomsListData = await roomsListResponse.json();

            if (roomsListData.status !== 'Success' || !Array.isArray(roomsListData.data)) {
                throw new Error('Respuesta inválida del servicio de verificación');
            }

            const targetRoom = roomsListData.data.find(
                (room: RoomData) => room.host_id === targetHostId
            );

            if (!targetRoom) {
                connectionAttempts.delete(targetHostId);
                return NextResponse.json(
                    {
                        success: false,
                        message: 'El canal seleccionado ya no está disponible.',
                    },
                    { status: 404 },
                );
            }

            if (targetRoom.another_user_id !== null) {
                connectionAttempts.delete(targetHostId);
                return NextResponse.json(
                    {
                        success: false,
                        message: 'El canal ya está ocupado por otro usuario.',
                    },
                    { status: 409 },
                );
            }

            // CAPA 3: Intento atómico de entrada con validación adicional
            const formdata = new FormData();
            formdata.append('user_id', String(maleUserId));
            formdata.append('host_id', String(targetHostId));
            formdata.append('timestamp', String(now)); // Para tracking

            const externalEnterRoomApiResponse = await fetch(
                'https://app.conexmeet.live/api/v1/enter-room',
                {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        Authorization: `Bearer ${authToken}`,
                    },
                    body: formdata,
                },
            );

            let enterRoomResponseData;
            try {
                enterRoomResponseData = await externalEnterRoomApiResponse.json();
            } catch (jsonError) {
                if (!externalEnterRoomApiResponse.ok) {
                    throw new Error(`API externa falló: ${externalEnterRoomApiResponse.status}`);
                }
                enterRoomResponseData = {
                    status: 'Success',
                    message: 'Operación exitosa',
                    data: {},
                };
            }

            // CAPA 4: Validación post-entrada
            if (
                enterRoomResponseData.status === 'Error' ||
                (enterRoomResponseData.data === 'Host no disponible') ||
                (enterRoomResponseData.message && enterRoomResponseData.message.toLowerCase().includes('ocupado'))
            ) {
                connectionAttempts.delete(targetHostId);
                return NextResponse.json(
                    {
                        success: false,
                        message: 'El canal fue ocupado por otro usuario durante la conexión.',
                    },
                    { status: 409 },
                );
            }

            if (!externalEnterRoomApiResponse.ok || enterRoomResponseData.status !== 'Success') {
                connectionAttempts.delete(targetHostId);
                return NextResponse.json(
                    {
                        success: false,
                        message: enterRoomResponseData.message || 'Error al conectar al canal.',
                    },
                    { status: externalEnterRoomApiResponse.status || 500 },
                );
            }

            // CAPA 5: Verificación final del estado
            const finalVerificationResponse = await fetch(listRoomsApiUrl, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${authToken}`,
                },
            });

            if (finalVerificationResponse.ok) {
                const finalData = await finalVerificationResponse.json();
                const finalRoom = finalData.data?.find((room: RoomData) => room.host_id === targetHostId);

                if (finalRoom && finalRoom.another_user_id && finalRoom.another_user_id !== maleUserId) {
                    // Otro usuario logró conectarse, revertir
                    await fetch('https://app.conexmeet.live/api/v1/leave-room', {
                        method: 'POST',
                        headers: {
                            Accept: 'application/json',
                            Authorization: `Bearer ${authToken}`,
                        },
                        body: formdata,
                    }).catch(() => { }); // Intentar limpiar, pero no fallar si no se puede

                    connectionAttempts.delete(targetHostId);
                    return NextResponse.json(
                        {
                            success: false,
                            message: 'Conexión simultánea detectada. Otro usuario se conectó primero.',
                        },
                        { status: 409 },
                    );
                }
            }

            // Éxito: mantener el lock por un momento más para evitar race conditions
            setTimeout(() => {
                if (targetHostId) {
                    connectionAttempts.delete(targetHostId);
                }
            }, 2000);

            return NextResponse.json(
                {
                    success: true,
                    message: enterRoomResponseData.message || 'Conexión exitosa al canal.',
                    data: enterRoomResponseData.data,
                },
                { status: 200 },
            );

        } catch (error: any) {
            // Limpiar el intento fallido
            if (targetHostId) {
                connectionAttempts.delete(targetHostId);
            }
            throw error;
        }

    } catch (error: any) {
        console.error('[API enter-channel-male-v2] Error:', error);

        // Asegurar limpieza en caso de error
        if (targetHostId) {
            connectionAttempts.delete(targetHostId);
        }

        return NextResponse.json(
            {
                success: false,
                message: 'Error interno al procesar la conexión al canal.',
                errorDetails: error.message,
            },
            { status: 500 },
        );
    }
}