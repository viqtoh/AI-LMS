# Use Node.js base image
FROM node:20-alpine AS backend

# Set working directory
WORKDIR /app/api

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install --omit=dev && npm install -g nodemon

# Inject environment variables
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

# Copy the rest of the source code
COPY . .

# Expose API port
EXPOSE 5000

# Start backend server
CMD ["npm","start"]
