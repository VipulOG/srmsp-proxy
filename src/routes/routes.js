import { axiosInstance } from "../axiosConfig.js";
import { streamToString } from "../utils.js";
import { handleHRDPage } from "./hrd.js";
import { handleAttendancePage } from "./attendance.js";
import { handleTimetablePage } from "./timetable.js";
import * as constants from "../constants.js";

export default function configureRoutes(app) {
  app.get("/injection/*", (req, res) => {
    res.sendFile(process.cwd() + "/src" + req.originalUrl);
  });

  app.get("/ping", (req, res) => {
    console.log("Ping");
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "*");
    res.send("pong");
  });

  app.all("*", async (req, res) => {
    try {
      console.log("Proxy Request:", req.method, req.originalUrl);
      if (req.method.toLowerCase() === "post") console.log("Body:", req.body);

      const axiosHeaders = { ...req.headers };
      delete axiosHeaders["content-length"];
      delete axiosHeaders["host"];

      const axiosResponse = await axiosInstance({
        url: req.originalUrl,
        method: req.method,
        responseType: "stream",
        headers: axiosHeaders,
        data: req.body,
      });

      console.log("Proxy Request Success:", req.method, req.originalUrl);

      const responseHeaders = { ...axiosResponse.headers };
      delete responseHeaders["content-length"];

      res.set(responseHeaders);
      res.status(axiosResponse.status);

      if (axiosResponse.headers["content-type"].includes("text/html")) {
        const html = await streamToString(axiosResponse.data);
        await handleHtmlResponse(html, req, res);
      } else {
        axiosResponse.data.pipe(res);
      }
    } catch (error) {
      console.error("Proxy Request Error:", error.message, error.stack);
      res.status(500).send("Internal Server Error");
    }
  });
}

async function handleHtmlResponse(html, req, res) {
  const regex = /https?:\/\/sp\.srmist\.edu\.in[^\s'">]*/g;
  html = html.replace(regex, (match) => {
    const url = new URL(match);
    return url.pathname;
  });

  if (req.originalUrl === constants.HRDPageURL) {
    handleHRDPage(req, res, html);
  } else if (req.originalUrl === constants.attendancePageURL) {
    handleAttendancePage(req, res, html);
  } else if (req.originalUrl === constants.timetablePageURL) {
    handleTimetablePage(req, res, html);
  } else {
    res.send(html);
  }
}
