# ======================================================================================
# ETAPA 1: BUILDER - Sigue siendo igual
# ======================================================================================
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ======================================================================================
# ETAPA 2: RUNNER - Se simplifica mucho gracias a 'output: standalone'
# ======================================================================================
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Define el usuario para ejecutar la aplicación (buenas prácticas de seguridad)
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copia la salida 'standalone' optimizada desde la etapa 'builder'
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copia las carpetas de activos estáticos
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# El comando de inicio ahora ejecuta el servidor de Node directamente
CMD ["node", "server.js"]