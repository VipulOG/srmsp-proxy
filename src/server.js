import express from "express";
import bodyParser from "body-parser";
import configureRoutes from "./routes.js";
import 'dotenv/config';

const app = express();
const serverPort = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
configureRoutes(app);

app.listen(serverPort, () => {
  console.log(`Server listening at ${process.env.host}`);
});
