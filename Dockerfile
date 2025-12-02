FROM node:18

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy everything
COPY . .

EXPOSE 8080

CMD ["node", "server-simple.js"]
