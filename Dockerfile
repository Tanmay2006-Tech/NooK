FROM node:20-alpine

RUN npm install -g pnpm

WORKDIR /app

COPY . .

RUN pnpm install

RUN pnpm --filter api-server build

EXPOSE 8080

CMD ["pnpm", "--filter", "api-server", "start"]