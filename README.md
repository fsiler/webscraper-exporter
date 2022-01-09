# Webscraper Exporter

A simple [`prometheus`](https://prometheus.io) exporter for website performance metrics using [`puppeteer`](https://pptr.dev/).

## CLI 

### Getting started

#### Installation

You can install the cli included to get started quickly with barely no configuration:

```bash
npm install --global webscraper-exporter 
```

or 

```bash
yarn add --global webscraper-exporter
```

You can then check if everything went OK by running:
```bash
wsce --version
```
This should print the package's version

#### Configuration

In your current working directory, create a file named `wsce.config.js` with the following example content:

```js
module.exports = {
    scraper: {
        urls: ["https://google.com"],
        puppeteerOptions: {},
        conditions: [],
        lighthouse: false,
        interval: 60_000,
    },
    exporter: {
        port: 3000
    },
};
```

For further information on the configuration, see [CONFIGURING.md](./docs/CONFIGURING.md)

#### Using

You can start the exporter by simply executing:

```
wsce
```

By default, if no port is provided, the exporter will listen on port `3000`

If you want more detailled logs, you can pass the `-v` argument.

To pass a custom config file, use `-c path/to/file`

### NodeJS module

#### Installing

```bash
npm install --save webscraper-exporter 
```

or 

```bash
yarn add webscraper-exporter
```

#### Using
```js
import { Exporter, Scraper } from "webscraper-exporter";

const scraper = new Scraper({
    urls: ["https://cstef.dev"],
    conditions: [
        {
            name: "Logger",
            twice: false,
            run: (browser, page, URL) => {
                console.log(`I am running on ${URL}`);
            },
        },
    ],
    lighthouse: false,
    verbose: true,
    interval: 60_000,
});
scraper.start();
const exporter = new Exporter({ 
    scraper, 
    port: 3000, 
    verbose: true 
});
exporter.start();
```
For more examples, see the [`examples`](./examples) folder.