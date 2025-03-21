# Use Node.js base image
FROM node:20-alpine AS frontend-build

# Set working directory
WORKDIR /app

# Copy and install dependencies for both frontend and backend
COPY package.json package-lock.json ./
RUN npm install

# Copy everything
COPY . .

# Inject environment variables (for React and Backend)

ARG REACT_APP_API_BASE_URL
ARG REACT_APP_IMAGE_HOST

ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
ENV REACT_APP_IMAGE_HOST=$REACT_APP_IMAGE_HOST


# Build the frontend
WORKDIR /app/frontend
RUN npm install
RUN npm run build


# Build Backend
FROM node:20-alpine AS backend


ARG PG_USER
ARG PG_HOST
ARG PG_DATABASE
ARG PG_PASSWORD
ARG PG_PORT
ARG JWT_SECRET
ARG JWT_EXPIRES_IN



ENV PG_USER=$PG_USER
ENV PG_HOST=$PG_HOST
ENV PG_DATABASE=$PG_DATABASE
ENV PG_PASSWORD=$PG_PASSWORD
ENV PG_PORT=$PG_PORT
ENV JWT_SECRET=$JWT_SECRET
ENV JWT_EXPIRES_IN=$JWT_EXPIRES_IN


WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]

# Serve Frontend with Nginx
FROM nginx:stable-alpine
COPY --from=frontend-build /app/frontend/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]