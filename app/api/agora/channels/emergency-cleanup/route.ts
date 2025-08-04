import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        // Manejar tanto JSON normal como Blob de sendBeacon
        let body;
        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            body = await request.json();
        } else {
            // Manejar Blob de sendBeacon
            const text = await request.text();
            body = JSON.parse(text);
        }

        console.log('[Emergency Cleanup] 📥 Request recibida:', {
            contentType,
            method: request.method,
            body: body
        });
        const { user_id, channel_name, room_id, role, reason } = body;

        // Obtener token de autenticación de las cookies
        const authToken = request.cookies.get('auth_token')?.value;
        console.log('[Emergency Cleanup] 🔑 Auth token disponible:', !!authToken);

        // Validar parámetros requeridos
        if (!user_id || !channel_name || !role) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Parámetros requeridos faltantes: user_id, channel_name, role',
                },
                { status: 400 }
            );
        }

        console.log(`[Emergency Cleanup] Iniciando limpieza de emergencia:`, {
            user_id,
            channel_name,
            room_id,
            role,
            reason,
            timestamp: new Date().toISOString(),
        });

        const cleanupPromises: Promise<any>[] = [];

        const { backend_action } = body;
        
        console.log(`[Emergency Cleanup] 📝 Limpieza solicitada para ${role} ${user_id} en canal ${channel_name}`);
        console.log(`[Emergency Cleanup] 🔄 Acción de backend: ${backend_action}`);

        // Implementar lógica de backend siguiendo handleLeaveCall
        if (backend_action === 'close_channel_finished' && role === 'female') {
            // Female se desconectó → Cerrar canal con status 'finished' (como handleLeaveCall línea 1176)
            console.log(`[Emergency Cleanup] 👩 Cerrando canal de female con status 'finished'`);
            
            const closeChannelPromise = fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/agora/channels/close-channel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Emergency-Cleanup': 'true',
                },
                body: JSON.stringify({
                    host_id: channel_name,
                    status: 'finished',
                }),
            }).then(async res => {
                const data = await res.json();
                console.log(`[Emergency Cleanup] 📤 Respuesta close-channel (female finished):`, data);
                return { operation: 'close-channel-finished', ...data };
            }).catch(error => {
                console.error(`[Emergency Cleanup] ❌ Error cerrando canal female:`, error);
                throw error;
            });

            cleanupPromises.push(closeChannelPromise);

        } else if (backend_action === 'close_channel_waiting_and_male' && role === 'male') {
            // Male se desconectó → Cerrar canal con 'waiting' + cerrar participación male (como handleLeaveCall líneas 1237-1244)
            console.log(`[Emergency Cleanup] 👨 Cerrando canal con status 'waiting' y participación de male`);
            
            // 1. Cerrar canal con status 'waiting'
            const closeChannelPromise = fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/agora/channels/close-channel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Emergency-Cleanup': 'true',
                },
                body: JSON.stringify({
                    host_id: channel_name,
                    status: 'waiting',
                }),
            }).then(async res => {
                const data = await res.json();
                console.log(`[Emergency Cleanup] 📤 Respuesta close-channel (waiting):`, data);
                return { operation: 'close-channel-waiting', ...data };
            }).catch(error => {
                console.error(`[Emergency Cleanup] ❌ Error cerrando canal waiting:`, error);
                throw error;
            });

            cleanupPromises.push(closeChannelPromise);

            // 2. Cerrar participación del male (si tenemos room_id)
            if (room_id && user_id !== 'unknown_male') {
                const closeMalePromise = fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/agora/channels/close-channel-male`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Emergency-Cleanup': 'true',
                    },
                    body: JSON.stringify({
                        user_id: user_id,
                        host_id: channel_name,
                        id: room_id,
                    }),
                }).then(async res => {
                    const data = await res.json();
                    console.log(`[Emergency Cleanup] 📤 Respuesta close-channel-male:`, data);
                    return { operation: 'close-male-channel', ...data };
                }).catch(error => {
                    console.error(`[Emergency Cleanup] ❌ Error cerrando participación male:`, error);
                    throw error;
                });

                cleanupPromises.push(closeMalePromise);
            } else {
                console.log(`[Emergency Cleanup] ⚠️ No se puede cerrar participación male: user_id=${user_id}, room_id=${room_id}`);
            }
        } else {
            console.log(`[Emergency Cleanup] ℹ️ Acción de backend no reconocida o no implementada: ${backend_action}`);
        }



        // Ejecutar operaciones de backend
        if (cleanupPromises.length > 0) {
            console.log(`[Emergency Cleanup] 🚀 Ejecutando ${cleanupPromises.length} operaciones de backend...`);
            
            const results = await Promise.allSettled(cleanupPromises);
            
            const successfulOps: string[] = [];
            const failedOps: string[] = [];
            
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    const response = result.value;
                    if (response.success) {
                        successfulOps.push(response.operation || `operation_${index}`);
                    } else {
                        failedOps.push(`${response.operation || `operation_${index}`}: ${response.message}`);
                    }
                } else {
                    failedOps.push(`operation_${index}: ${result.reason}`);
                }
            });
            
            console.log(`[Emergency Cleanup] 📊 Resultados: ${successfulOps.length} exitosas, ${failedOps.length} fallidas`);
            
            return NextResponse.json({
                success: successfulOps.length > 0,
                message: successfulOps.length > 0 
                    ? `Limpieza de backend ejecutada. Exitosas: ${successfulOps.length}, Fallidas: ${failedOps.length}`
                    : `Error en limpieza de backend. Todas las operaciones fallaron.`,
                details: {
                    successful_operations: successfulOps,
                    failed_operations: failedOps,
                    backend_action: backend_action,
                    role: role,
                    reason: reason,
                    timestamp: new Date().toISOString(),
                },
            });
        } else {
            console.log(`[Emergency Cleanup] ℹ️ No hay operaciones de backend para ejecutar`);
            
            return NextResponse.json({
                success: true,
                message: `Solicitud procesada pero no hay operaciones de backend para ${backend_action}`,
                details: {
                    note: "No se ejecutaron operaciones de backend",
                    backend_action: backend_action,
                    role: role,
                    reason: reason,
                    timestamp: new Date().toISOString(),
                },
            });
        }

    } catch (error) {
        console.error('[Emergency Cleanup] Error en limpieza de emergencia:', error);

        return NextResponse.json(
            {
                success: false,
                message: 'Error interno durante la limpieza de emergencia',
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}

// Método GET para verificar el estado del endpoint
export async function GET() {
    return NextResponse.json({
        success: true,
        message: 'Emergency cleanup endpoint is active',
        timestamp: new Date().toISOString(),
    });
}