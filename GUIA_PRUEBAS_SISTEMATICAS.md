# 🧪 Guía de Pruebas Sistemáticas

## 📊 Monitor de Estado

He agregado un monitor de estado en la esquina inferior derecha que te mostrará:
- Estado del usuario local (role, status, channel)
- Estado del heartbeat (activo, último envío)
- Lista de females online
- Usuarios remotos conectados

**Cómo usarlo**: Haz clic en "📊 Monitor" para expandir el panel.

## 🔍 Pruebas a Realizar

### 1. **Prueba de Heartbeat System** ✅/❌

**Objetivo**: Verificar que el sistema de heartbeat funciona correctamente

**Pasos**:
1. Female crea un canal
2. Verificar en el monitor que "Heartbeat Active: ✅"
3. Verificar que "Last" se actualiza cada 5 segundos
4. Verificar que "Backend Count" aumenta en 1

**Resultado Esperado**:
- ✅ Heartbeat se inicia automáticamente
- ✅ Se envía cada 5 segundos
- ✅ Backend registra el heartbeat

**Tu Resultado**: ✅/❌ _________________

---

### 2. **Prueba de Detección de Desconexión** ✅/❌

**Objetivo**: Verificar que el sistema detecta cuando female se desconecta

**Pasos**:
1. Female crea canal (heartbeat activo)
2. Female refresca la página
3. Esperar 15-30 segundos
4. Verificar logs en consola del navegador
5. Verificar logs en consola del servidor

**Resultado Esperado**:
- ✅ Heartbeat se detiene al refrescar
- ✅ Backend detecta timeout después de 15s
- ✅ Aparece log: "[Heartbeat Cleanup] Usuario desconectado detectado"

**Tu Resultado**: ✅/❌ _________________

---

### 3. **Prueba de Actualización de Lobby** ✅/❌

**Objetivo**: Verificar que el lobby se actualiza correctamente

**Pasos**:
1. Female crea canal → Status debe ser "available_call"
2. Male observa la lista de females
3. Female refresca página
4. Esperar 30-45 segundos
5. Male verifica que female aparece como "online" (no "available_call")

**Resultado Esperado**:
- ✅ Female aparece inicialmente como "available_call"
- ✅ Después de desconexión aparece como "online"
- ✅ host_id se limpia (null)
- ✅ in_call cambia a 0

**Tu Resultado**: ✅/❌ _________________

---

### 4. **Prueba de Detector de Zombies** ✅/❌

**Objetivo**: Verificar que el detector encuentra canales zombie

**Pasos**:
1. Female crea canal
2. Female refresca página (simular desconexión abrupta)
3. Esperar 30-45 segundos
4. Verificar logs: "[Zombie Detector] Canal zombie detectado"
5. Verificar que female se actualiza en el lobby

**Resultado Esperado**:
- ✅ Detector encuentra el canal zombie
- ✅ Actualiza el estado de la female
- ✅ Logs aparecen correctamente

**Tu Resultado**: ✅/❌ _________________

---

### 5. **Prueba de Notificación a Males** ✅/❌

**Objetivo**: Verificar que males reciben notificación cuando female se desconecta

**Pasos**:
1. Male se conecta a canal de female
2. Female refresca página
3. Verificar que male recibe modal de "Female desconectada"

**Resultado Esperado**:
- ✅ Modal aparece automáticamente
- ✅ Muestra el nombre de la female
- ✅ Indica razón de desconexión

**Tu Resultado**: ✅/❌ _________________

---

### 6. **Prueba de Heartbeat de Males** ✅/❌ (NUEVA FUNCIONALIDAD)

**Objetivo**: Verificar que males también envían heartbeat cuando están en llamada

**Pasos**:
1. Female crea canal
2. Male se conecta al canal
3. Verificar en el monitor que aparece heartbeat del male
4. Verificar que "Backend Count" aumenta a 2 (female + male)
5. Male refresca página
6. Verificar que heartbeat del male desaparece
7. Verificar que female cambia de "in_call" a "available_call"

**Resultado Esperado**:
- ✅ Male envía heartbeat cuando está en llamada
- ✅ Backend registra heartbeats de ambos usuarios
- ✅ Cuando male se desconecta, female vuelve a "available_call"

**Tu Resultado**: ✅/❌ _________________

---

### 7. **Prueba de Estado del Backend** ❌ (PROBLEMA CONOCIDO)

**Objetivo**: Verificar el estado del canal en el backend

**Pasos**:
1. Female crea canal → Backend debe mostrar "waiting"
2. Female refresca página
3. Esperar 30-45 segundos
4. Verificar estado del canal en base de datos/backend

**Resultado Esperado**:
- ❌ Canal se queda en "waiting" (PROBLEMA)
- ✅ Debería cambiar a "finished"

**Tu Resultado**: ❌ (Confirmar problema)

---

## 📋 Formato de Reporte

Para cada prueba, reporta:

```
### Prueba X: [Nombre]
**Estado**: ✅ Funciona / ❌ Falla / ⚠️ Parcial

**Detalles**:
- Lo que funciona bien: ___________
- Lo que falla: ___________
- Logs relevantes: ___________
- Observaciones: ___________
```

## 🎯 Prioridades

1. **Alta Prioridad**: Pruebas 1-5 (deben funcionar)
2. **Nueva Funcionalidad**: Prueba 6 (heartbeat de males - debe funcionar)
3. **Problema Conocido**: Prueba 7 (backend - sabemos que falla)

## 📊 Herramientas de Debugging

- **Monitor de Estado**: Panel en esquina inferior derecha
- **Consola del Navegador**: Para logs del frontend
- **Consola del Servidor**: Para logs del backend
- **DevTools Network**: Para verificar requests HTTP

## 🚀 Después de las Pruebas

Una vez que tengas los resultados, podremos:
1. Confirmar qué funciona bien (no tocar)
2. Identificar qué necesita arreglo
3. Enfocar esfuerzos solo en lo que falla
4. Implementar solución específica para el backend

**¡Listo para empezar las pruebas!** 🧪