FROM eclipse-temurin:17-jdk-jammy

WORKDIR /worker
COPY package.json ./
COPY src ./src
COPY test.js ./

ENV NODE_ENV=production
ENV WORKSPACE_ROOT=/workspace/veyro
ENV POLL_MS=2000

CMD ["node", "src/index.js"]
