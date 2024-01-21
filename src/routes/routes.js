import { axiosInstance } from "../axiosConfig.js";
import { streamToString } from "../utils.js";
import { handleAttendancePage } from "./attendance.js";
import { handleTimetablePage } from "./timetable.js";
import { attendancePageURL, timetablePageURL } from "../constants.js";

export default function configureRoutes(app) {
  app.get("/injection/*", (req, res) => {
    res.sendFile(process.cwd() + "/src" + req.originalUrl);
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
      if (req.method === "POST") console.log("Body:", req.body);

      const responseHeaders = { ...axiosResponse.headers };
      delete responseHeaders["content-length"];
      res.set(responseHeaders);

      res.status(axiosResponse.status);

      if (axiosResponse.headers["content-type"].includes("text/html")) {
        const html = await streamToString(axiosResponse.data);
        const newHtml = html.replace(
          new RegExp(axiosInstance.defaults.baseURL, "g"),
          process.env.host
        );

        if (req.originalUrl === attendancePageURL) {
          handleAttendancePage(req, res, newHtml);
        } else if (req.originalUrl === timetablePageURL) {
          handleTimetablePage(req, res, newHtml);
        } else res.send(newHtml);
      } else axiosResponse.data.pipe(res);
    } catch (error) {
      console.error("Proxy Request Error:", error.message, error.stack);
      res.status(500).send("Internal Server Error");
    }
  });
}
