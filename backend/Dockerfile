FROM node:18-slim

# Install system dependencies required by PhantomJS/html-pdf
RUN apt-get update && apt-get install -y \
    fontconfig \
    libfontconfig1 \
    libfreetype6 \
    bzip2 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port
EXPOSE 5000

# Start the application
CMD ["node", "server.js"]
