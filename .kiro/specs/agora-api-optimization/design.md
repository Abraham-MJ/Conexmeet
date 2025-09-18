# Design Document - Optimización de APIs de Agora

## Overview

El diseño se basa en crear **configuraciones específicas** que aprovechen el hook `useApi` existente, sin modificar su funcionalidad core. Crearemos un sistema de configuraciones predefinidas optimizadas para cada tipo de operación de Agora, manteniendo la arquitectura actual pero mejorando significativamente el rendimiento.

## Architecture

### Arquitectura Actual (Mantenemos)
```
Hooks de Agora → AgoraApiClient → fetch() directo
```

### Arquitectura Optimizada (Nueva)
```
Hooks de Agora → Configuraciones Optimizadas → useApi → APIs de Agora
```

### Principios de Diseño
1. **No Breaking Changes**: Mantener la misma interfaz pública
2. **Configuración por Tipo**: Cada tipo de operación tiene configuración específica
3. **Reutilización**: Aprovechar completamente `useApi` existente
4. **Gradual Migration**: Migrar hook por hook sin afectar funcionalidad

## Components and Interfaces

### 1. Configuraciones de API por Tipo

```typescript
// app/hooks/agora/configs/agoraApiConfigs.ts
export const AGORA_API_CONFIGS = {
  // Tokens - Críticos para conexión, cache corto por seguridad
  tokens: {
    cacheTime: 30 * 1000,        // 30 segundos
    staleTime: 15 * 1000,        // 15 segundos
    retryAttempts: 3,
    retryDelay: 1000,
    method: 'GET' as const,
  },
  
  // Verificación de canales - Cache medio para reducir latencia
  channelVerification: {
    cacheTime: 10 * 1000,        // 10 segundos
    staleTime: 5 * 1000,         // 5 segundos
    retryAttempts: 2,
    retryDelay: 800,
    method: 'GET' as const,
  },
  
  // Gestión de canales - Cache corto para operaciones críticas
  channelManagement: {
    cacheTime: 5 * 1000,         // 5 segundos
    staleTime: 2 * 1000,         // 2 segundos
    retryAttempts: 2,
    retryDelay: 1000,
    method: 'POST' as const,
  },
  
  // Cleanup de emergencia - Sin cache, mínimos reintentos
  emergencyCleanup: {
    cacheTime: 0,                // Sin cache
    staleTime: 0,
    retryAttempts: 1,
    retryDelay: 500,
    method: 'POST' as const,
  },
  
  // Lista de females - Cache medio para listas
  femalesList: {
    cacheTime: 30 * 1000,        // 30 segundos
    staleTime: 15 * 1000,        // 15 segundos
    retryAttempts: 2,
    retryDelay: 1000,
    method: 'GET' as const,
  },
  
  // Traducción - Cache largo para textos repetidos
  translation: {
    cacheTime: 2 * 60 * 1000,    // 2 minutos
    staleTime: 1 * 60 * 1000,    // 1 minuto
    retryAttempts: 2,
    retryDelay: 800,
    method: 'POST' as const,
  },
  
  // Regalos - Sin cache, múltiples reintentos
  gifts: {
    cacheTime: 0,                // Sin cache
    staleTime: 0,
    retryAttempts: 3,
    retryDelay: 1000,
    method: 'POST' as const,
  },
};
```

### 2. Hook de Configuraciones Optimizadas

```typescript
// app/hooks/agora/useOptimizedAgoraApi.ts
export const useOptimizedAgoraApi = () => {
  // Tokens
  const useTokenRTC = (channelName: string, role: string, uid: string) => 
    useApi(`/api/agora/get-token-rtc?channel=${channelName}&rol=${role}&type=uid&uid=${uid}`, 
           AGORA_API_CONFIGS.tokens, false);
  
  const useTokenRTM = (uid: string) => 
    useApi(`/api/agora/get-token-rtm?uid=${uid}`, 
           AGORA_API_CONFIGS.tokens, false);
  
  // Verificación de canales
  const useChannelVerification = (hostId: string) => 
    useApi(`/api/agora/channels/verify-availability?host_id=${hostId}`, 
           AGORA_API_CONFIGS.channelVerification, false);
  
  // Gestión de canales
  const useChannelManagement = () => 
    useApi('', AGORA_API_CONFIGS.channelManagement, false);
  
  // Emergency cleanup
  const useEmergencyCleanup = () => 
    useApi('/api/agora/channels/emergency-cleanup', 
           AGORA_API_CONFIGS.emergencyCleanup, false);
  
  // Lista de females
  const useFemalesList = () => 
    useApi('/api/agora/host', AGORA_API_CONFIGS.femalesList, false);
  
  // Traducción
  const useTranslation = () => 
    useApi('/api/translate', AGORA_API_CONFIGS.translation, false);
  
  // Regalos
  const useGifts = () => 
    useApi('/api/gift/send-gifts', AGORA_API_CONFIGS.gifts, false);
  
  return {
    useTokenRTC,
    useTokenRTM,
    useChannelVerification,
    useChannelManagement,
    useEmergencyCleanup,
    useFemalesList,
    useTranslation,
    useGifts,
  };
};
```

### 3. Migración del AgoraApiClient

El `AgoraApiClient` se actualizará para usar las configuraciones optimizadas:

```typescript
// lib/agora-api-client.ts (actualizado)
import { useOptimizedAgoraApi } from '@/app/hooks/agora/useOptimizedAgoraApi';

export const AgoraApiClient = {
  // En lugar de fetch directo, usar configuraciones optimizadas
  async fetchRtcToken(channelName: string, roleForToken: string, rtcUid: string): Promise<string> {
    const { useTokenRTC } = useOptimizedAgoraApi();
    const { execute } = useTokenRTC(channelName, roleForToken, rtcUid);
    const response = await execute();
    return response.rtcToken;
  },
  
  // Similar para todas las demás funciones...
};
```

## Data Models

### Configuración de API
```typescript
interface AgoraApiConfig {
  cacheTime: number;           // Tiempo de cache en ms
  staleTime: number;           // Tiempo de datos stale en ms
  retryAttempts: number;       // Número de reintentos
  retryDelay: number;          // Delay entre reintentos en ms
  method: 'GET' | 'POST';      // Método HTTP
}

interface AgoraApiConfigs {
  tokens: AgoraApiConfig;
  channelVerification: AgoraApiConfig;
  channelManagement: AgoraApiConfig;
  emergencyCleanup: AgoraApiConfig;
  femalesList: AgoraApiConfig;
  translation: AgoraApiConfig;
  gifts: AgoraApiConfig;
}
```

### Respuestas de API
```typescript
// Mantener todas las interfaces existentes
interface TokenResponse {
  rtcToken?: string;
  rtmToken?: string;
}

interface ChannelResponse {
  success: boolean;
  message?: string;
  data?: any;
}

// etc...
```

## Error Handling

### Estrategia de Manejo de Errores
1. **Rate Limiting**: Configuraciones específicas previenen exceso de requests
2. **Reintentos Inteligentes**: Diferentes estrategias según criticidad
3. **Fallbacks**: Mantener funcionalidad básica en caso de fallo
4. **Logging**: Registro detallado para debugging

### Implementación
```typescript
// Cada configuración incluye manejo específico de errores
const handleTokenError = (error: any) => {
  console.error('[AGORA_TOKENS] Error:', error);
  // Lógica específica para tokens
};

const handleChannelError = (error: any) => {
  console.error('[AGORA_CHANNELS] Error:', error);
  // Lógica específica para canales
};
```

## Testing Strategy

### Pruebas de Configuración
1. **Unit Tests**: Verificar configuraciones correctas
2. **Integration Tests**: Probar integración con `useApi`
3. **Performance Tests**: Medir mejoras de rendimiento
4. **Error Handling Tests**: Verificar manejo de errores

### Métricas a Medir
- Reducción en número de requests
- Mejora en tiempos de respuesta
- Reducción de errores de rate limiting
- Estabilidad de conexiones

## Migration Plan

### Fase 1: Crear Configuraciones
1. Crear `agoraApiConfigs.ts`
2. Crear `useOptimizedAgoraApi.ts`
3. Pruebas unitarias de configuraciones

### Fase 2: Migrar AgoraApiClient
1. Actualizar métodos uno por uno
2. Mantener compatibilidad hacia atrás
3. Pruebas de integración

### Fase 3: Migrar Hooks Específicos
1. `useAgoraServer.ts`
2. `useChannelValidation.ts`
3. `useCallFlows.ts`
4. `useBeforeUnloadCleanup.ts`
5. `useAgoraChannel.ts` (traducción)

### Fase 4: Optimizaciones Finales
1. Ajustar configuraciones basado en métricas
2. Cleanup de código legacy
3. Documentación final

## Performance Expectations

### Mejoras Esperadas
- **50-70% reducción** en requests de tokens (cache)
- **60% reducción** en verificaciones de canales (cache)
- **80% reducción** en traducciones repetidas (cache)
- **Eliminación completa** de errores "Too Many Requests"
- **30-50% mejora** en tiempos de conexión

### Monitoreo
- Logs de cache hits/misses
- Métricas de reintentos
- Tiempos de respuesta
- Tasa de errores por tipo de API