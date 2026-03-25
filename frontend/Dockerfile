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
    location /api/ {\n\
        proxy_pass http://backend:3000/api/;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Upgrade $http_upgrade;\n\
        proxy_set_header Connection "upgrade";\n\
        proxy_set_header Host $host;\n\
    }\n\
    location /uploads/ {\n\
        proxy_pass http://backend:3000/uploads/;\n\
        proxy_set_header Host $host;\n\
    }\n\
    location /socket.io/ {\n\
        proxy_pass http://backend:3000/socket.io/;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Upgrade $http_upgrade;\n\
        proxy_set_header Connection "upgrade";\n\
        proxy_set_header Host $host;\n\
    }\n\
}\n\
' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
