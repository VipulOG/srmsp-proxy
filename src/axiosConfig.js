import axios from "axios";
import { Readable } from "stream";

const baseURL = "http://localhost:3000";
const targetURL = "https://sp.srmist.edu.in";

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

function streamToString(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", (err) => reject(err));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

class StringToStream extends Readable {
  constructor(str) {
    super();
    this.push(str);
    this.push(null);
  }
}

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
