import { Router } from "express";
import fs from "fs";
import path from "path";
import Web3 from "web3";

const router = Router();
const keystorePath = path.join(__dirname, "../../keystore");

router.post("/create-account", async (req: any, res: any) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).send({ error: "Password is required" });
  }

  const web3 = new Web3();
  const account = web3.eth.accounts.create();
  const keystore = web3.eth.accounts.encrypt(account.privateKey, password);

  if (!fs.existsSync(keystorePath)) {
    fs.mkdirSync(keystorePath);
  }

  const filePath = path.join(keystorePath, `${account.address}.json`);
  fs.writeFileSync(filePath, JSON.stringify(keystore));

  res
    .status(201)
    .send({ message: "Account created", address: account.address });
});

export default router;
