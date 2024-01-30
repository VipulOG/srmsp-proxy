import axios from "axios";

const targetURL = "https://sp.srmist.edu.in";

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const axiosInstance = axios.create({
  baseURL: targetURL,
});

export { axiosInstance };
