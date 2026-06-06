FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Ensure the places image directory exists inside the image
RUN mkdir -p public/img/places

EXPOSE 3000
CMD ["node", "app.js"]
