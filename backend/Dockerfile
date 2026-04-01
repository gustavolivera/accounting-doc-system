FROM node:22-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN apk add --no-cache openssl

RUN npm install

COPY . .

# Generate Prisma Client before build
RUN npx prisma generate

RUN npm run build

EXPOSE 3000

CMD ["/bin/sh", "-c", "npx prisma db push && npx prisma db seed && npm run start:prod"]
