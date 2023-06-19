FROM node:20-alpine

WORKDIR /usr/src
COPY package.json ./
#COPY yarn.lock ./
COPY src src
COPY public public
COPY templates templates
COPY config/default.wsce.config.js config/default.wsce.config.js
COPY tsconfig.json ./

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN apk add chromium build-base python3 --no-cache
RUN yarn
RUN yarn build
RUN npm link

COPY config/docker.wsce.config.js config/wsce.config.js

EXPOSE 9924
ENTRYPOINT [ "wsce", "start", "-v", "-y"]
