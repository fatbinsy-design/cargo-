FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
RUN npm run prisma:generate

COPY . .

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
