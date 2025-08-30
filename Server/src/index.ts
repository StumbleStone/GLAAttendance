import chalk from "chalk";
import express, { NextFunction, Request, Response } from "express";
import * as path from "path";
import { Tool } from "./Toolbox.js";

const app = express();
const port: number = 8180;
const cwd = process.cwd();
const clientPath: string = path.join(cwd.substring(0, cwd.indexOf('Server')), "/Client/dist/");

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

function sendFile(path: string) {
  let fullPath: string = clientPath + path;
  return (req: Request, res: Response) => {
    res.sendFile(fullPath, (err: Error) => {
      if (err) console.error("sendFile", err);
    });
  };
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
app.get("/Styles/main.css", sendFile("/Styles/main.css"));
app.get("/favicon.ico", sendFile("favicon.png"));
app.get("/AddIcon.png", sendFile("/Images/Add.png"));
app.get("/Images/*", sendImage);
app.get("/Svg/*", sendSvg);

app.get("", sendFile("index.html"));
app.get("/", sendFile("index.html"));

app.get("*", notFound);

app.listen(port, () => {
  console.log(chalk.green("Listening on http://localhost:" + port));
});

function close() {
  console.log("Closing server.");
  // inspector.close();
  process.exit();
}

process.on("SIGTERM", close);
process.on("SIGINT", close);
