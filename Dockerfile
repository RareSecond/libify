FROM node:lts

WORKDIR /app

COPY . .
RUN npm install

WORKDIR /app/backend
RUN npm install
RUN npx prisma generate
RUN npm run build

# Make startup script executable
COPY backend/start.sh .
RUN chmod +x start.sh

EXPOSE 3000
CMD ["./start.sh"]
