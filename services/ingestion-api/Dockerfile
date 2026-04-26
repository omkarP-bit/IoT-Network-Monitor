FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN apk add --no-cache curl && npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "src/index.js"]