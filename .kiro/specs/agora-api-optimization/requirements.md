# Requirements Document - Optimización de APIs de Agora

## Introducción

El sistema de video chat utiliza múltiples APIs de Agora que actualmente presentan problemas de rendimiento y estabilidad. Los usuarios experimentan errores de "Too Many Requests", conexiones lentas, y fallos en operaciones críticas como obtención de tokens y heartbeats. Necesitamos optimizar estas APIs manteniendo la arquitectura existente con `useApi` pero adaptando la configuración específica para cada tipo de operación de Agora.

## Análisis del Problema Actual

### APIs de Agora Identificadas (en uso activo):
1. `/api/agora/get-token-rtc` - Tokens para conexión RTC (usado en AgoraApiClient)
2. `/api/agora/get-token-rtm` - Tokens para mensajería RTM (usado en AgoraApiClient)
3. `/api/agora/channels/verify-availability` - Verificación de canales (usado en useChannelValidation)
4. `/api/agora/channels/enter-channel-male-v2` - Entrada de usuarios masculinos (usado en useCallFlows)
5. `/api/agora/channels/emergency-cleanup` - Limpieza de emergencia (usado en useBeforeUnloadCleanup)
6. `/api/agora/channels/create-channel` - Creación de canales (usado en AgoraApiClient)
7. `/api/agora/channels/close-channel-male` - Cierre de canal masculino (usado en AgoraApiClient)
8. `/api/agora/channels/close-channel` - Cierre de canal (usado en AgoraApiClient)
9. `/api/agora/channels/cleanup-after-male-disconnect` - Limpieza post-desconexión (usado en AgoraApiClient)
10. `/api/agora/host` - Lista de females online (usado en AgoraApiClient)
11. `/api/translate` - Traducción de mensajes (usado en useAgoraChannel)
12. `/api/gift/send-gifts` - Envío de regalos (usado en AgoraApiClient)

### Problemas Identificados:
- Rate limiting por exceso de requests repetitivos
- Configuración de cache inadecuada para cada tipo de operación
- Falta de reintentos específicos para operaciones críticas
- No hay deduplicación de requests simultáneos

## Requirements

### Requirement 1: Optimización de Configuración de Cache

**User Story:** Como desarrollador del sistema de video chat, quiero que cada API de Agora tenga una configuración de cache optimizada según su naturaleza, para que las operaciones sean más eficientes y se reduzcan los requests innecesarios.

#### Acceptance Criteria

1. WHEN se solicita un token RTC/RTM THEN el sistema SHALL usar cache de 30 segundos para balancear seguridad y performance
2. WHEN se verifica disponibilidad de canal THEN el sistema SHALL usar cache de 10 segundos para reducir latencia
3. WHEN se crean o gestionan canales THEN el sistema SHALL usar cache de 5 segundos para operaciones de gestión
4. WHEN se solicita traducción THEN el sistema SHALL usar cache de 2 minutos para textos repetidos
5. WHEN se ejecuta emergency cleanup THEN el sistema SHALL NO usar cache por ser operación crítica

### Requirement 2: Configuración de Reintentos Específicos

**User Story:** Como usuario del video chat, quiero que las operaciones críticas tengan reintentos automáticos apropiados, para que las conexiones sean más estables y confiables.

#### Acceptance Criteria

1. WHEN falla obtención de token RTC/RTM THEN el sistema SHALL reintentar 3 veces con delay exponencial
2. WHEN falla verificación de canal THEN el sistema SHALL reintentar 2 veces
3. WHEN falla gestión de canales THEN el sistema SHALL reintentar 2 veces para operaciones críticas
4. WHEN falla emergency cleanup THEN el sistema SHALL reintentar solo 1 vez por ser crítico
5. WHEN falla traducción THEN el sistema SHALL reintentar 2 veces con fallback al texto original

### Requirement 3: Deduplicación de Requests Simultáneos

**User Story:** Como desarrollador, quiero evitar múltiples requests simultáneos a la misma API con los mismos parámetros, para que se reduzca la carga del servidor y se eviten errores de rate limiting.

#### Acceptance Criteria

1. WHEN se hacen múltiples requests simultáneos al mismo endpoint con mismos parámetros THEN el sistema SHALL deduplicar y retornar la misma promesa
2. WHEN se completa un request deduplicado THEN el sistema SHALL resolver todas las promesas pendientes con el mismo resultado
3. WHEN falla un request deduplicado THEN el sistema SHALL rechazar todas las promesas pendientes con el mismo error

### Requirement 4: Configuración Específica por Tipo de Operación

**User Story:** Como desarrollador, quiero tener configuraciones predefinidas para cada tipo de operación de Agora, para que sea fácil usar las APIs optimizadas sin configurar manualmente cada vez.

#### Acceptance Criteria

1. WHEN se necesita obtener tokens THEN el sistema SHALL usar configuración optimizada para tokens (cache 30s, 3 reintentos)
2. WHEN se necesita verificar canales THEN el sistema SHALL usar configuración optimizada para verificación (cache 10s, 2 reintentos)
3. WHEN se necesita gestionar canales THEN el sistema SHALL usar configuración optimizada para gestión (cache 5s, 2 reintentos)
4. WHEN se necesita traducción THEN el sistema SHALL usar configuración optimizada para traducción (cache 2min, 2 reintentos)
5. WHEN se necesita cleanup THEN el sistema SHALL usar configuración optimizada para cleanup (sin cache, 1 reintento)
6. WHEN se necesita obtener lista de females THEN el sistema SHALL usar configuración optimizada para listas (cache 30s, 2 reintentos)
7. WHEN se necesita enviar regalos THEN el sistema SHALL usar configuración optimizada para regalos (sin cache, 3 reintentos)

### Requirement 5: Integración con useApi Existente

**User Story:** Como desarrollador, quiero mantener la arquitectura existente con `useApi`, para que no tengamos que reescribir todo el código existente y mantengamos la consistencia.

#### Acceptance Criteria

1. WHEN se implementen las optimizaciones THEN el sistema SHALL usar el hook `useApi` existente como base
2. WHEN se creen configuraciones específicas THEN el sistema SHALL extender `useApi` sin modificar su funcionalidad core
3. WHEN se migren los hooks existentes THEN el sistema SHALL mantener la misma interfaz pública
4. WHEN se usen las APIs optimizadas THEN el sistema SHALL ser compatible con el código existente
5. WHEN se implementen las optimizaciones THEN el sistema SHALL mantener todas las funcionalidades actuales de `useApi`

### Requirement 6: Monitoreo y Logging

**User Story:** Como desarrollador, quiero tener visibilidad sobre el rendimiento de las APIs optimizadas, para que pueda identificar problemas y medir mejoras.

#### Acceptance Criteria

1. WHEN se usa cache THEN el sistema SHALL loggear cache hits/misses para métricas
2. WHEN se ejecutan reintentos THEN el sistema SHALL loggear intentos y razones de fallo
3. WHEN se deduplicán requests THEN el sistema SHALL loggear eventos de deduplicación
4. WHEN ocurren errores THEN el sistema SHALL loggear contexto específico de Agora
5. WHEN se completan operaciones THEN el sistema SHALL loggear tiempos de respuesta para análisis