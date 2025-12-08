# ============================================
# Stage 1: Build Angular App
# ============================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Argumentos de build para configurar el API URL
ARG API_URL=http://localhost:3000
ENV API_URL=${API_URL}

# Reemplazar API URL en el archivo de environment antes del build
RUN sed -i "s|http://18.220.15.227:3000|${API_URL}|g" src/environments/environment.ts && \
    sed -i "s|http://18.220.15.227:3000|${API_URL}|g" src/environments/environment.prod.ts

# Build de producción
RUN npm run build -- --configuration production

# ============================================
# Stage 2: Serve with Nginx
# ============================================
FROM nginx:alpine

# Copiar configuración de Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar archivos compilados de Angular
# Angular 21 genera los archivos en dist/<project-name>/browser
COPY --from=builder /app/dist/safesteps/browser /usr/share/nginx/html

# Exponer puerto 80
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
