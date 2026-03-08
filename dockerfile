# Use a lightweight version of Node.js
FROM node:20-alpine

# Create the directory where your app will live inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first
# This allows Docker to cache your dependencies if they haven't changed
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your application code
COPY . .

# Your app runs on port 4000 (as specified in .env)
EXPOSE 4000

# The command to start your app (point to the correct entry file)
CMD ["node", "src/app.js"]