# Stage 1: build frontend
FROM node:20-alpine AS build
WORKDIR /frontend
COPY frontend/package.json .
RUN npm install --include=dev && npm install --save-dev sharp
COPY frontend/ .
RUN node scripts/gen-icons.mjs && npm run build

# Stage 2: production
FROM node:20-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY backend/package.json .
RUN npm install
COPY backend/src/ ./src/
COPY --from=build /frontend/dist ./public
CMD ["node", "src/index.js"]