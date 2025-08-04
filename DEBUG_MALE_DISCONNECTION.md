# 🐛 Debug: Male Disconnection Problem

## 🎯 Problema

Cuando un male se desconecta abruptamente (cierra pestaña), la female NO cambia de `in_call` a `available_call`.

## 🛠️ Herramientas de Debug

### 1. **Monitor Principal** (📊 Monitor)
- Muestra heartbeats activos
- Estado general del sistema

### 2. **Male Debug Panel** (🐛 Male Debug)
- Específico para este problema
- Muestra females in_call vs male heartbeats
- Detecta discrepancias automáticamente
- Botón para forzar verificación

## 🔍 Pasos de Debug

### Paso 1: Configurar Escenario
1. Female crea canal
2. Male se conecta al canal
3. Abrir ambos paneles de debug

### Paso 2: Verificar Estado Inicial
**En 📊 Monitor:**
- Heartbeat Active: ✅ (para ambos usuarios)
- Backend Count: 2

**En 🐛 Male Debug:**
- Females in_call: 1 (la female conectada)
- Male Heartbeats: 1 (el male conectado)
- Problemas Detectados: (vacío)

### Paso 3: Simular Desconexión
1. Male cierra pestaña abruptamente
2. Observar cambios en tiempo real

### Paso 4: Verificar Detección
**Esperado después de 15-30 segundos:**

**En 📊 Monitor:**
- Backend Count: 1 (solo female)

**En 🐛 Male Debug:**
- Females in_call: 1 (female sigue in_call)
- Male Heartbeats: 0 (male desapareció)
- Problemas Detectados: "Female sin male en CHANNEL-ID"

### Paso 5: Verificar Corrección
**Esperado después de 30-60 segundos:**
- Female debe cambiar de `in_call` a `available_call`
- Logs deben mostrar: "Male desconectado, actualizando female a available_call"

## 📊 Logs a Buscar

### Consola del Navegador

**Heartbeat Logs:**
```
[Heartbeat] 📤 Enviando heartbeat para male: {user_id, channel_name, role}
[Heartbeat] ✅ male heartbeat enviado correctamente
```

**Zombie Detector Logs:**
```
[Zombie Detector] 🔍 Iniciando verificación de canales zombie...
[Zombie Detector] 📊 Verificando X females...
[Zombie Detector] 🔍 Buscando females con males desconectados...
[Zombie Detector] 🚨 Male desconectado detectado en canal CHANNEL-ID
[Zombie Channel] 👨‍💻 Male desconectado, actualizando female a available_call: CHANNEL-ID
```

### Consola del Servidor

**Heartbeat Backend:**
```
[Heartbeat] ❤️ Recibido de male USER_ID en canal CHANNEL-ID
[Heartbeat Cleanup] 🧹 Usuario desconectado detectado: {user_id, role: 'male'}
[Heartbeat Cleanup] 👨 Male desconectado - notificando al frontend
```

## 🚨 Posibles Problemas

### 1. **Male No Envía Heartbeat**
**Síntomas:**
- Backend Count no aumenta cuando male se conecta
- No aparecen logs de heartbeat del male

**Verificar:**
- ¿Male tiene `current_room_id`?
- ¿Male está realmente `isRtcJoined`?
- ¿Hay errores en la consola del male?

### 2. **Zombie Detector No Se Ejecuta**
**Síntomas:**
- No aparecen logs de "Iniciando verificación"
- Panel de debug no muestra actividad

**Verificar:**
- ¿Zombie detector está habilitado?
- ¿Hay errores en el useEffect?

### 3. **Detección No Funciona**
**Síntomas:**
- Logs muestran verificación pero no encuentra problemas
- Female sigue in_call aunque male se desconectó

**Verificar:**
- ¿Los channel_name coinciden exactamente?
- ¿El processedZombiesRef está bloqueando la detección?

### 4. **Actualización No Se Aplica**
**Síntomas:**
- Se detecta el problema pero female no cambia de estado
- Logs muestran detección pero no actualización

**Verificar:**
- ¿El dispatch se está ejecutando?
- ¿Hay errores en el reducer?

## 🧪 Tests Manuales

### Test 1: Heartbeat del Male
```
1. Male se conecta
2. Verificar en 📊 Monitor que Backend Count = 2
3. Verificar logs: "[Heartbeat] male heartbeat enviado"
```

### Test 2: Detección de Desconexión
```
1. Male cierra pestaña
2. Esperar 30 segundos
3. Verificar en 🐛 Male Debug: "Problemas Detectados"
4. Usar botón "🧪 Force Check" si es necesario
```

### Test 3: Corrección Automática
```
1. Después de detectar problema
2. Esperar 30 segundos más
3. Verificar que female cambia a available_call
4. Verificar logs de actualización
```

## 📋 Checklist de Debug

- [ ] Male envía heartbeat al conectarse
- [ ] Backend registra heartbeat del male
- [ ] Heartbeat del male se detiene al desconectarse
- [ ] Zombie detector se ejecuta cada 30s
- [ ] Detector encuentra female sin male heartbeat
- [ ] Se ejecuta callback de zombie detectado
- [ ] Female cambia de in_call a available_call
- [ ] Logs aparecen en consola

## 🎯 Resultado Esperado

Después del debug, deberías poder identificar exactamente en qué paso falla el proceso y así poder arreglarlo específicamente.

**¡Usa las herramientas de debug para encontrar dónde se rompe la cadena!**