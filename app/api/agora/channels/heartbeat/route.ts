import { NextRequest, NextResponse } from 'next/server';

const heartbeats = new Map<
  string,
  {
    user_id: string;
    channel_name: string;
    room_id: string;
    role: string;
    timestamp: number;
    lastSeen: number;
  }
>();

setInterval(() => {
  const now = Date.now();
  const TIMEOUT_MS = 45000;

  for (const [key, heartbeat] of heartbeats.entries()) {
    if (now - heartbeat.lastSeen > TIMEOUT_MS) {
      cleanupDisconnectedChannel(heartbeat);

      heartbeats.delete(key);
    }
  }
}, 60000);

async function cleanupDisconnectedChannel(heartbeat: any) {
  if (heartbeat.role === 'male') {
    try {
      console.error(
        `[Heartbeat Cleanup] 📢 Male ${heartbeat.user_id} desconectado del canal ${heartbeat.channel_name}`,
      );
    } catch (error) {
      console.error(
        `[Heartbeat Cleanup] ❌ Error notificando desconexión de male:`,
        error,
      );
    }
  }
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
        { status: 400 },
      );
    }

    const heartbeatKey = `${user_id}_${channel_name}`;
    const now = Date.now();

    heartbeats.set(heartbeatKey, {
      user_id,
      channel_name,
      room_id,
      role,
      timestamp: timestamp || now,
      lastSeen: now,
    });

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
      { status: 500 },
    );
  }
}

export async function GET() {
  const now = Date.now();
  const activeHeartbeats = Array.from(heartbeats.entries()).map(
    ([key, heartbeat]) => ({
      key,
      ...heartbeat,
      secondsSinceLastSeen: Math.floor((now - heartbeat.lastSeen) / 1000),
    }),
  );

  return NextResponse.json({
    success: true,
    active_heartbeats: activeHeartbeats.length,
    heartbeats: activeHeartbeats,
    timestamp: now,
  });
}
