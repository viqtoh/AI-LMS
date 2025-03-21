# Build frontend with environment variables
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend

# Copy package.json and install dependencies
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install

# Inject environment variables into the React build
ARG PG_USER
ARG PG_HOST
ARG PG_DATABASE
ARG PG_PASSWORD
ARG PG_PORT
ARG JWT_SECRET
ARG JWT_EXPIRES_IN
ARG REACT_APP_API_BASE_URL
ARG REACT_APP_IMAGE_HOST

ENV PG_USER=$PG_USER
ENV PG_HOST=$PG_HOST
ENV PG_DATABASE=$PG_DATABASE
ENV PG_PASSWORD=$PG_PASSWORD
ENV PG_PORT=$PG_PORT
ENV JWT_SECRET=$JWT_SECRET
ENV JWT_EXPIRES_IN=$JWT_EXPIRES_IN
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
ENV REACT_APP_IMAGE_HOST=$REACT_APP_IMAGE_HOST

# Copy source code and build
COPY frontend ./
RUN npm run build

# Build backend
FROM python:3.11 AS backend
WORKDIR /app/api
COPY api/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY api ./

# Serve frontend with Nginx
FROM nginx:stable-alpine
COPY --from=frontend-build /app/frontend/build /usr/share/nginx/html
COPY --from=backend /app/api /app/api

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
