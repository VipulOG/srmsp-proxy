import axios from "axios";
import 'dotenv/config';
import { StringToStream, streamToString } from "./utils.js";

const baseURL = process.env.host;
const targetURL = "https://sp.srmist.edu.in";

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const axiosInstance = axios.create({
  baseURL: targetURL,
});

axiosInstance.interceptors.response.use(
  async (response) => {
    if (response.headers["content-type"].includes("text/html")) {
      const html = await streamToString(response.data);
      const newHtml = html.replace(new RegExp(targetURL, "g"), baseURL);
      response.data = new StringToStream(newHtml);
    }
    return response;
  },
);

export { axiosInstance };
