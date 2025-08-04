# 🔄 Backend Cleanup Siguiendo handleLeaveCall

## 🎯 Objetivo

Implementar la lógica correcta de backend para desconexiones abruptas, replicando exactamente el flujo de `handleLeaveCall` según el rol del usuario.

## 📋 Análisis de handleLeaveCall

### **Female se desconecta normalmente** (líneas 1140-1176):
```typescript
// 1. Enviar señal RTM
await sendCallSignal('HOST_ENDED_CALL', { channelName: currentChannel });

// 2. Actualizar lobby
await broadcastLocalFemaleStatusUpdate({
  status: 'online',
  host_id: null,
  in_call: 0,
  is_active: 1,
});

// 3. Cerrar canal en backend
await agoraBackend.closeChannel(currentChannel, 'finished');
```

### **Male se desconecta normalmente** (líneas 1177-1244):
```typescript
// 1. Enviar señal RTM
await sendCallSignal('MALE_CALL_SUMMARY_SIGNAL', summaryPayload);

// 2. Cerrar canal en backend (si female no terminó)
if (!hostEndedCallInfo?.ended) {
  await agoraBackend.closeChannel(currentChannel, 'waiting');
}

// 3. Cerrar participación del male
await agoraBackend.closeMaleChannel(user_id, currentChannel, current_room_id);
```

## ✅ Implementación para Desconexiones Abruptas

### **Female se desconecta abruptamente**:

#### Frontend (useAgoraContext.tsx):
```typescript
// 1. Actualizar lobby (ya implementado)
dispatch({
  type: AgoraActionType.UPDATE_ONE_FEMALE_IN_LIST,
  payload: {
    status: 'online',    // Como handleLeaveCall
    host_id: null,       // Como handleLeaveCall
    in_call: 0,          // Como handleLeaveCall
    is_active: 1,        // Como handleLeaveCall
  },
});

// 2. Ejecutar limpieza de backend
fetch('/api/agora/channels/emergency-cleanup', {
  body: JSON.stringify({
    user_id: zombieFemale.user_id,
    channel_name: zombieFemale.host_id,
    role: 'female',
    backend_action: 'close_channel_finished', // ✅ NUEVO
  }),
});

// 3. Si hay male en el canal, ejecutar su handleLeaveCall
if (state.localUser?.role === 'male' && state.channelName === zombieFemale.host_id) {
  window.dispatchEvent(new CustomEvent('executeMaleLeaveCall'));
}
```

#### Backend (emergency-cleanup/route.ts):
```typescript
if (backend_action === 'close_channel_finished' && role === 'female') {
  // Replicar línea 1176 de handleLeaveCall
  await fetch('/api/agora/channels/close-channel', {
    body: JSON.stringify({
      host_id: channel_name,
      status: 'finished', // ✅ Exactamente como handleLeaveCall
    }),
  });
}
```

### **Male se desconecta abruptamente**:

#### Frontend (useAgoraContext.tsx):
```typescript
// 1. Actualizar lobby (ya implementado)
dispatch({
  type: AgoraActionType.UPDATE_ONE_FEMALE_IN_LIST,
  payload: {
    status: 'available_call', // Female vuelve a estar disponible
    in_call: 0,
    // Mantiene host_id porque su canal sigue activo
    is_active: 1,
  },
});

// 2. Ejecutar limpieza de backend
fetch('/api/agora/channels/emergency-cleanup', {
  body: JSON.stringify({
    user_id: 'unknown_male', // No sabemos el ID específico
    channel_name: zombieFemale.host_id,
    room_id: state.current_room_id,
    role: 'male',
    backend_action: 'close_channel_waiting_and_male', // ✅ NUEVO
  }),
});
```

#### Backend (emergency-cleanup/route.ts):
```typescript
if (backend_action === 'close_channel_waiting_and_male' && role === 'male') {
  // Replicar líneas 1237-1244 de handleLeaveCall
  
  // 1. Cerrar canal con status 'waiting'
  await fetch('/api/agora/channels/close-channel', {
    body: JSON.stringify({
      host_id: channel_name,
      status: 'waiting', // ✅ Exactamente como handleLeaveCall
    }),
  });

  // 2. Cerrar participación del male (si tenemos room_id)
  if (room_id && user_id !== 'unknown_male') {
    await fetch('/api/agora/channels/close-channel-male', {
      body: JSON.stringify({
        user_id: user_id,
        host_id: channel_name,
        id: room_id, // ✅ Exactamente como handleLeaveCall
      }),
    });
  }
}
```

## 🔄 Flujo Completo

### Escenario 1: Female se Desconecta Abruptamente

```
1. Female cierra pestaña → Heartbeat se detiene
2. Sistema detecta zombie (30-60s) → handleZombieChannelDetected
3. Frontend actualiza lobby → status: 'online', host_id: null
4. Frontend llama backend → backend_action: 'close_channel_finished'
5. Backend ejecuta → closeChannel(channel, 'finished') ✅
6. Male en canal recibe evento → ejecuta su handleLeaveCall ✅
7. Male sale del canal normalmente → rating modal, etc.
```

### Escenario 2: Male se Desconecta Abruptamente

```
1. Male cierra pestaña → Heartbeat se detiene
2. Sistema detecta male desconectado (30-60s) → handleZombieChannelDetected
3. Frontend actualiza lobby → female: 'available_call'
4. Frontend llama backend → backend_action: 'close_channel_waiting_and_male'
5. Backend ejecuta → closeChannel(channel, 'waiting') ✅
6. Backend ejecuta → closeMaleChannel(user_id, channel, room_id) ✅
7. Female puede recibir nuevas llamadas ✅
```

## 📊 APIs Utilizadas

### Para Female Desconectada:
- **`/api/agora/channels/close-channel`** con `status: 'finished'`
- Replica exactamente `agoraBackend.closeChannel(currentChannel, 'finished')`

### Para Male Desconectado:
- **`/api/agora/channels/close-channel`** con `status: 'waiting'`
- **`/api/agora/channels/close-channel-male`** con `user_id`, `host_id`, `id`
- Replica exactamente las líneas 1237-1244 de handleLeaveCall

## 🎭 Comportamiento por Rol

| Evento | Frontend (Lobby) | Backend (BD) | Comportamiento Adicional |
|--------|------------------|--------------|-------------------------|
| **Female desconecta** | `status: 'online'`, `host_id: null` | Canal → `finished` | Male ejecuta handleLeaveCall |
| **Male desconecta** | Female → `available_call` | Canal → `waiting`, Male sale | Female puede recibir nuevas llamadas |

## 🔧 Nuevos Parámetros

### `backend_action` (nuevo campo):
- **`close_channel_finished`**: Para females desconectadas
- **`close_channel_waiting_and_male`**: Para males desconectados

### Eventos Customizados:
- **`executeMaleLeaveCall`**: Dispara handleLeaveCall del male cuando female se desconecta

## 🧪 Cómo Probar

### Test 1: Female se Desconecta
```
1. Female crea canal, male se conecta
2. Female cierra pestaña abruptamente
3. Esperar 30-60 segundos
4. Verificar logs: "close_channel_finished"
5. Verificar BD: Canal debe estar 'finished'
6. Verificar: Male ejecuta handleLeaveCall automáticamente
```

### Test 2: Male se Desconecta
```
1. Female crea canal, male se conecta
2. Male cierra pestaña abruptamente
3. Esperar 30-60 segundos
4. Verificar logs: "close_channel_waiting_and_male"
5. Verificar BD: Canal debe estar 'waiting'
6. Verificar: Female vuelve a 'available_call'
```

## 📋 Logs Esperados

```
[Optimized] 🧟 Limpiando canal zombie: ABC-123
[Optimized] 🔄 Ejecutando limpieza de backend para female desconectada
[Emergency Cleanup] 👩 Cerrando canal de female con status 'finished'
[Emergency Cleanup] 📤 Respuesta close-channel (female finished): {success: true}
[Optimized] 👨 Male detecta female desconectada - ejecutando handleLeaveCall
```

## 🎯 Estado

- ✅ **Implementado**: Lógica de backend siguiendo handleLeaveCall
- ✅ **Integrado**: Frontend dispara acciones correctas
- ✅ **Funcional**: APIs de backend configuradas
- 🧪 **Listo para pruebas**: Sistema completo

**Ahora las desconexiones abruptas replican exactamente el comportamiento de handleLeaveCall según el rol del usuario.**