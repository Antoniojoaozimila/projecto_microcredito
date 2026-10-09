# Versão web do telemóvel (react-native-web), servida em /m/.
# O aplicativo nativo (APK/IPA) NÃO passa por aqui: é compilado com o EAS (ver DEPLOY.md).
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN npm ci

COPY . .
ARG EXPO_PUBLIC_API_URL=""
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
RUN npx vite build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
# O Vite foi compilado com base "/m/", por isso os ficheiros ficam numa pasta "m".
COPY --from=build /app/dist /usr/share/nginx/html/m
EXPOSE 80
