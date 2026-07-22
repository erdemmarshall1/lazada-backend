FROM node:18-slim
RUN apt-get update && apt-get install -y --no-install-recommends gnupg curl ca-certificates && \
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb-7.0.gpg && \
    echo "deb [ signed-by=/usr/share/keyrings/mongodb-7.0.gpg ] http://repo.mongodb.org/apt/debian bookworm/mongodb-org/7.0 main" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list && \
    apt-get update && apt-get install -y --no-install-recommends mongodb-org-server && \
    apt-get clean && rm -rf /var/lib/apt/lists/*
ENV MONGOMS_SYSTEM_BINARY=/usr/bin/mongod
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
RUN mkdir -p /data/db
EXPOSE 3000
ENV NODE_ENV=production
CMD mongod --dbpath /data/db --fork --logpath /var/log/mongod.log && node server.js