import { NextRequest, NextResponse } from 'next/server';

// Almacenar heartbeats en memoria (en producción usar Redis o DB)
const heartbeats = new Map<string, {
  user_id: string;
  channel_name: string;
  room_id: string;
  role: string;
  timestamp: number;
  lastSeen: number;
}>();

// Limpiar heartbeats antiguos cada 30 segundos
setInterval(() => {
  const now = Date.now();
  const TIMEOUT_MS = 45000; // 45 segundos sin heartbeat = desconectado (más conservador)
  
  for (const [key, heartbeat] of heartbeats.entries()) {
    if (now - heartbeat.lastSeen > TIMEOUT_MS) {
      console.log(`[Heartbeat Cleanup] 💀 Usuario ${heartbeat.user_id} desconectado - limpiando canal ${heartbeat.channel_name}`);
      
      // Limpiar canal automáticamente
      cleanupDisconnectedChannel(heartbeat);
      
      // Remover heartbeat
      heartbeats.delete(key);
    }
  }
}, 60000); // Verificar cada 60 segundos en lugar de 30

async function cleanupDisconnectedChannel(heartbeat: any) {
  console.log(`[Heartbeat Cleanup] 🧹 Usuario desconectado detectado:`, {
    user_id: heartbeat.user_id,
    channel_name: heartbeat.channel_name,
    role: heartbeat.role,
    lastSeen: new Date(heartbeat.lastSeen).toISOString(),
  });
  
  // Si es un male que se desconectó, necesitamos notificar al frontend
  // para que actualice el estado de la female
  if (heartbeat.role === 'male') {
    console.log(`[Heartbeat Cleanup] 👨 Male desconectado - notificando al frontend`);
    
    // Crear evento para notificar al frontend sobre la desconexión del male
    // Esto se manejará en el frontend para actualizar el estado de la female
    try {
      // Emitir evento global que el frontend pueda escuchar
      // Por ahora solo loggeamos, el frontend detectará esto via zombie detector
      console.log(`[Heartbeat Cleanup] 📢 Male ${heartbeat.user_id} desconectado del canal ${heartbeat.channel_name}`);
    } catch (error) {
      console.error(`[Heartbeat Cleanup] ❌ Error notificando desconexión de male:`, error);
    }
  }
  
  console.log(`[Heartbeat Cleanup] ℹ️ Limpieza de backend temporalmente deshabilitada`);
  // TODO: Implementar lógica correcta de limpieza de backend
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, channel_name, room_id, role, timestamp } = body;

    if (!user_id || !channel_name || !role) {
      return NextResponse.json(
        {
          success: false,
          message: 'Parámetros requeridos: user_id, channel_name, role',
        },
        { status: 400 }
      );
    }

    const heartbeatKey = `${user_id}_${channel_name}`;
    const now = Date.now();

    // Actualizar heartbeat
    heartbeats.set(heartbeatKey, {
      user_id,
      channel_name,
      room_id,
      role,
      timestamp: timestamp || now,
      lastSeen: now,
    });

    console.log(`[Heartbeat] ❤️ Recibido de ${role} ${user_id} en canal ${channel_name}`);

    return NextResponse.json({
      success: true,
      message: 'Heartbeat registrado',
      timestamp: now,
      active_heartbeats: heartbeats.size,
    });

  } catch (error) {
    console.error('[Heartbeat] Error procesando heartbeat:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno procesando heartbeat',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Endpoint para obtener estado de heartbeats (útil para debugging)
export async function GET() {
  const now = Date.now();
  const activeHeartbeats = Array.from(heartbeats.entries()).map(([key, heartbeat]) => ({
    key,
    ...heartbeat,
    secondsSinceLastSeen: Math.floor((now - heartbeat.lastSeen) / 1000),
  }));

  return NextResponse.json({
    success: true,
    active_heartbeats: activeHeartbeats.length,
    heartbeats: activeHeartbeats,
    timestamp: now,
  });
}