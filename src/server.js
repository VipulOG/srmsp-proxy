import express from "express";
import bodyParser from "body-parser";
import configureRoutes from "./routes.js";

const app = express();
const serverPort = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
configureRoutes(app);

app.listen(serverPort, () => {
  console.log(`Server listening at http://localhost:${serverPort}`);
});
