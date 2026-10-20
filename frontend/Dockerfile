# Сборка SPA (TypeScript → статика в dist).
FROM node:20-alpine AS build

WORKDIR /app

# Сначала только манифесты — слой с зависимостями кэшируется между сборками.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# Раздача статики и прокси /api, /health на backend.
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# busybox wget уже есть в alpine — curl не нужен.
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
    CMD ["wget", "-q", "--spider", "http://127.0.0.1/"]

CMD ["nginx", "-g", "daemon off;"]
