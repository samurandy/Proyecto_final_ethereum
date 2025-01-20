import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

import dockerRoute from "./routes/dockerRoute";
import genesisRoute from "./routes/genesisRoute";
import keystoreRoute from "./routes/keystoreRoute";
import networkRoute from "./routes/networkRoute";

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.use("/docker", dockerRoute);
app.use("/genesis", genesisRoute);
app.use("/keystore", keystoreRoute);
app.use("/networks", networkRoute);
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

export default app;
