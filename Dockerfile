FROM node:20-alpine

WORKDIR /usr/src

RUN apk add chromium build-base python3 optipng --no-cache

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
COPY package.json ./
COPY tsconfig.json ./
RUN yarn

COPY src src
RUN yarn build

COPY public public
COPY templates templates
COPY config/default.wsce.config.js config/default.wsce.config.js

RUN npm link

COPY config/docker.wsce.config.js config/wsce.config.js

EXPOSE 9924
ENTRYPOINT [ "wsce", "start", "-v", "-y"]
