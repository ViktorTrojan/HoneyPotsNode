# === Build Stage ===
FROM node:16 AS build-stage
WORKDIR /app
# Copy package.json and package-lock.json to the working directory
COPY package*.json ./
RUN npm install
# Copy the rest of the application code
COPY . .
RUN npm run build


# === Production Stage ===
# Use a smaller base image for the production stage
FROM node:16-alpine 
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY --from=build-stage /app/package*.json ./
# Install only production dependencies
RUN npm install --only=prod

# Copy built code from the build stage
COPY --from=build-stage /app/build ./build
COPY --from=build-stage /app/host.key ./
EXPOSE 9736
CMD ["npm", "run", "production"]