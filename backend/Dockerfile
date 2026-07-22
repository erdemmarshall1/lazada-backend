FROM node:18
RUN apt-get update && apt-get install -y --no-install-recommends wget ca-certificates && \
    apt-get clean && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
RUN wget -q https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-debian11-7.0.0.tgz -O /tmp/mongo.tgz && \
    tar xzf /tmp/mongo.tgz -C /tmp && \
    mv /tmp/mongodb-linux-x86_64-debian11-7.0.0/bin/* /usr/local/bin/ && \
    rm -rf /tmp/mongodb-linux-x86_64-debian11-7.0.0 /tmp/mongo.tgz
ENV MONGOMS_SYSTEM_BINARY=/usr/local/bin/mongod
COPY . .
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "server.js"]