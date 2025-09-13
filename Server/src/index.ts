import chalk from "chalk";
import express, { NextFunction, Request, Response } from "express";
import * as fse from "fs-extra";
import * as https from "https";
import * as path from "path";
import { Tool } from "./Toolbox.js";
const app = express();
const port: number = 8181;
const cwd = (() => {
  const cw = process.cwd();
  return cw.substring(
    0,
    cw.indexOf("Server") > -1 ? cw.indexOf("Server") : cw.length
  );
})();
const clientPath: string = path.join(cwd, "/Client/dist/");
const serverPath: string = path.join(cwd, "/Server/");

console.log(chalk.green(`Serving files from ${chalk.cyan(clientPath)}`));

function logRequest(req: Request, res: Response, next: NextFunction) {
  console.log(
    chalk.gray(Tool.epochToTime(Date.now())),
    chalk.cyan(req.protocol),
    chalk.yellow(req.method),
    chalk.magenta(req.url)
  );
  next();
}

function notFound(req: Request, res: Response) {
  console.error("HTTP:", req.method, req.url, chalk.red("NOT FOUND"));
  res.status(404);
  res.end();
}

function redirect(route: string) {
  return (req: Request, res: Response) => {
    res.redirect(route);
  };
}

function sendFile(_path: string) {
  let fullPath: string = path.join(clientPath, _path);
  return (req: Request, res: Response) => {
    res.sendFile(fullPath, (err: Error) => {
      if (err) console.error("sendFile", err);
    });
  };
}

function sendScript(req: Request, res: Response) {
  let fullPath: string = path.join(clientPath, req.url);
  res.sendFile(fullPath, (err: Error) => {
    if (err) console.error("sendScript", err);
  });
}

function sendImage(req: Request, res: Response) {
  let fullPath: string = path.join(clientPath, req.url);
  res.sendFile(fullPath, (err: Error) => {
    if (err) console.error("sendImage", err);
  });
}

function sendSvg(req: Request, res: Response) {
  let fullPath: string = path.join(clientPath, req.url);
  res.sendFile(fullPath, (err: Error) => {
    if (err) console.error("sendSvg", err);
  });
}

app.use(express.json());

app.all("*", logRequest);

app.get("/bundle.js", sendFile("bundle.js"));
app.get("/*.js", sendScript);
app.get("/Styles/main.css", sendFile("/Styles/main.css"));
app.get("/favicon.png", sendFile("favicon.png"));
app.get("/AddIcon.png", sendFile("/Images/Add.png"));
app.get("/Images/*", sendImage);
app.get("/Svg/*", sendSvg);

app.get("", sendFile("index.html"));
app.get("/", sendFile("index.html"));

app.get("*", notFound);

app.listen(port, () => {
  console.log(chalk.green("Listening on http://localhost:" + port));
});

async function setupSecureServer() {
  let cert: Buffer;
  let key: Buffer;
  try {
    cert = await fse.readFile(path.join(serverPath, "/certs/server.cert"));
    key = await fse.readFile(path.join(serverPath, "/certs/server.key"));
  } catch (err) {
    console.error("Cannot start HTTPS server");
    console.error(err);
    return;
  }

  const httpsServer = https
    .createServer(
      {
        key,
        cert,
      },
      app
    )
    .listen(8443, () => {
      console.log("Listening on https://localhost:8443");
    });
}

function close() {
  console.log("Closing server.");
  // inspector.close();
  process.exit();
}

process.on("SIGTERM", close);
process.on("SIGINT", close);
setupSecureServer();
