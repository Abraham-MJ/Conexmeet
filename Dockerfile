# ======================================================================================
# ETAPA 1: BUILDER - Compila la aplicación Next.js usando Node 22
# ======================================================================================
FROM node:22-alpine AS builder

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia los archivos de manifiesto del paquete para aprovechar el caché de Docker
COPY package.json package-lock.json ./

# Instala las dependencias de forma limpia y eficiente
RUN npm ci

# Copia el resto del código fuente de la aplicación
COPY . .

# Construye la aplicación para producción
RUN npm run build

# ======================================================================================
# ETAPA 2: RUNNER - Prepara la imagen final para producción usando Node 22
# ======================================================================================
FROM node:22-alpine AS runner

WORKDIR /app

# No queremos instalar las dependencias de desarrollo en producción
ENV NODE_ENV=production

# Copia los archivos de manifiesto de nuevo
COPY package.json package-lock.json ./

# Instala ÚNICAMENTE las dependencias de producción
# La opción --omit=dev es el estándar moderno para esto.
RUN npm ci --omit=dev

# Copia los artefactos de la compilación desde la etapa 'builder'
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.js ./

# Expone el puerto en el que Next.js se ejecuta por defecto
EXPOSE 3000

# Define el usuario para ejecutar la aplicación (buenas prácticas de seguridad)
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Cambia al nuevo usuario
USER nextjs

# El comando que se ejecutará cuando el contenedor se inicie
CMD ["npm", "start"]