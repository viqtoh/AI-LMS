# Use Node.js base image
FROM node:20-alpine AS frontend-build

# Set working directory
WORKDIR /app/frontend

# Copy and install dependencies for both frontend and backend
COPY package.json package-lock.json ./
RUN npm install



# Inject environment variables (for React and Backend)

ARG REACT_APP_API_BASE_URL
ARG REACT_APP_IMAGE_HOST

ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
ENV REACT_APP_IMAGE_HOST=$REACT_APP_IMAGE_HOST


COPY . .

RUN npm run build

# Serve with Nginx
FROM nginx:stable-alpine

# Copy built frontend to Nginx web server directory
COPY --from=frontend-build /app/frontend/build /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]