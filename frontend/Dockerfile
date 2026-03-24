# Build phase
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production phase
FROM nginx:alpine
# Copia o build do react da etapa anterior
COPY --from=build /app/dist /usr/share/nginx/html
# Copia um conf básico para suportar rotas do React Router no Nginx
RUN echo $'\n\
server {\n\
    listen 80;\n\
    location / {\n\
        root   /usr/share/nginx/html;\n\
        index  index.html index.htm;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}\n\
' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
