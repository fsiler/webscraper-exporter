import { createServer, IncomingMessage, Server, ServerResponse } from "http";
import client, { Gauge } from "prom-client";
import url from "url";
import { Scraper } from "../index";
import { TestResult } from "../scraper/types";
import { EventEmitter } from "events";
import { LogLevel } from "..";
import { ScrapeResult } from "../scraper";
import { GAUGES } from "./constants";
import { blueBright } from "colorette";
import { readFileSync } from "fs-extra";
import { extname, join } from "path";
import { createReadStream, readdir, statSync } from "fs";
import { promisify } from "util";

interface Exporter {
    on(event: "info", listener: (message: string) => void): this;
    on(event: "warn", listener: (message: string) => void): this;
    on(event: "error", listener: (message: string) => void): this;
    on(event: "debug", listener: (message: string) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;
}
class Exporter extends EventEmitter {
    server: Server | null;
    register: client.Registry;
    scraper: Scraper;
    gauges: { getProperty: (res: ScrapeResult) => number; gauge: client.Gauge<string> }[];
    constructor(public options: ExporterOptions) {
        super();
        this.server = null;
        this.register = client.register;
        this.scraper = options.scraper;
        this.options.port = this.options.port || 9924;
        this.gauges = GAUGES.map(({ getProperty, gauge }) => ({
            getProperty,
            gauge: new Gauge(gauge),
        }));
    }
    private _emitLog(level: LogLevel, ...args: any[]) {
        switch (level) {
            case LogLevel.DEBUG:
                this.emit("debug", args);
                break;
            case LogLevel.WARN:
                this.emit("warn", args);
                break;
            case LogLevel.INFO:
                this.emit("info", args);
                break;
            case LogLevel.ERROR:
                this.emit("error", args);
                break;
        }
    }
    start() {
        this.server = createServer();
        this.server.listen(this.options.port);
        this._emitLog(
            LogLevel.INFO,
            `Exporter listening on ${blueBright(
                `http://localhost${this.options.port === 80 ? "" : `:${this.options.port}`}/metrics`
            )}`
        );
        this.server.on("request", this._get.bind(this));
        this.scraper.on("testsFinish", this._handleTestsFinish.bind(this));
        return this;
    }
    private async _handleTestsFinish(test: TestResult) {
        for (let URL in test) {
            let t = test[URL];
            for (let { test, addons } of t.scrape) {
                const labels = { url: URL, addons: addons.map((e) => e.name).join(",") };
                for (let { gauge, getProperty } of this.gauges)
                    gauge.set(labels, getProperty(test));
            }
        }
    }

    private async handleImagesRequest(res: ServerResponse) {
      try {
        const readdirAsync = promisify(readdir);
        const files = await readdirAsync(process.cwd());
        const pngFiles = files.filter(file => extname(file) === ".png");
        const fileEntries = pngFiles.map((file) => {
	      const filePath = join("./", file);
              const stat = statSync(filePath);
              const timestamp = file.split("-")[0];
              const isoDate = new Date(Number(timestamp)).toISOString().substring(0, 19);
	      return `\n      <li><a href="/images/${file}">${file}</a> - ${isoDate} - ${stat.size} bytes</li>`;
            });
        const html = `<html>
  <head>
    <title>Image Listing</title>
  </head>
  <body>
    <h1>Image Listing</h1>
    <ul>${fileEntries}
    </ul>
  </body>
</html>\n`;
        res.setHeader("Content-Type", "text/html");
        res.statusCode = 200;
        res.end(html);
      } catch (error) {
        res.statusCode = 500;
        res.end("Error retrieving image listing.");
      }
    }

    private async handleImageRequest(imagePath: string, res: ServerResponse) {
      try {
        const filePath = join("/usr/src/", imagePath);
        const fileExtension = extname(imagePath).toLowerCase();
        if (fileExtension === ".png") {
          const fileStream = createReadStream(filePath);
          res.setHeader("Content-Type", "image/png");
          fileStream.pipe(res);
        } else {
          res.statusCode = 400;
          res.end("Invalid image format. Only PNG images are supported.\n");
        }
      } catch (error) {
        res.statusCode = 404;
        res.end("Image not found.\n");
      }
    }

    private async _get(req: IncomingMessage, res: ServerResponse) {
	const route = url.parse(req.url as string).pathname ?? "/";

        switch (route) {
            case "/metrics": {
                res.setHeader("Content-Type", this.register.contentType);
                res.end(await this.register.metrics());
                break;
            }
            case "/": {
                res.setHeader("Content-Type", "text/html");
                res.end(
                    readFileSync(join(__dirname, "../../public/index.html"), { encoding: "utf8" })
                );
	        break;
            }
            case "/images": {
              await this.handleImagesRequest(res);
              break;
            }
            default: {
              if (route.startsWith("/images/")) {
                const imagePath = route.substring(8);
                await this.handleImageRequest(imagePath, res);
              } else {
                res.statusCode = 404;
                res.end("Not found.\n");
              }
              break;
            }
        }
    }
    stop() {
        this._emitLog(LogLevel.DEBUG, "Stopping the exporter");
        this.server?.close();
        this.server = null;
        client.register.clear();
    }
}
export { Exporter };

export interface ExporterOptions {
    port: number;
    scraper: Scraper;
}
