# Use a lightweight version of Node.js
FROM node:22-alpine

# Create the directory where your app will live inside the container
WORKDIR /src/app

# Copy package.json and package-lock.json first
# This allows Docker to cache your dependencies if they haven't changed
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy the rest of your application code
COPY . .

# Your app runs on port 4000 (as specified in .env)
EXPOSE 4000

ENV NODE_ENV=production


# The command to start your app (point to the correct entry file)
CMD ["node", "src/app.js"]