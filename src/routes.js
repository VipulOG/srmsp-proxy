import { axiosInstance } from "./axiosConfig.js";

export default function configureRoutes(app) {
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
      axiosResponse.data.pipe(res);
    } catch (error) {
      console.error("Proxy Request Error:", error.message, error.stack);
      res.status(500).send("Internal Server Error");
    }
  });
}
