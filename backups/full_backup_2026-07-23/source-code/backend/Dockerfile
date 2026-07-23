FROM node:18-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates libcurl4 libgssapi-krb5-2 libsasl2-2 && \
    apt-get clean && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "server.js"]