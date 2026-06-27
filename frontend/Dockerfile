# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy source code and build
COPY . .
ENV GENERATE_SOURCEMAP=false
ENV NODE_ENV=production
RUN npm run build

# Production stage
FROM nginx:alpine
# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy built static assets from the build stage
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
