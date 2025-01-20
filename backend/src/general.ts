import express from "express";
import { Request, Response } from "express";
import cors from "cors";
import { ethers } from "ethers";
import fs from "fs/promises";
//Esto carga las variables de entorno:
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());
const port = 3333;

//-----------------------------------------------------------------

//La manera con la librería ethers
app.get("/api/balanceEthers/:address", async (req, res) => {
  const { address } = req.params;
  const provider = new ethers.JsonRpcProvider(process.env.URL_NODO);
  const balance = await provider.getBalance(address);

  res.json({
    address,
    balance: Number(balance) / 10 ** 18,
    fecha: new Date().toISOString(),
  });
});

//Otra manera que se hace exactamente como en el front con el fetch
app.get("/api/balance/:address", async (req: Request, res: Response) => {
  const address = req.params.address;

  const retorno = await fetch(process.env.URL_NODO as string, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_getBalance",
      params: [address, "latest"],
      id: 1,
    }),
  });
  const data: any = await retorno.json();
  //res.json(Number(data.result) / 10**18)
  res.json({
    address,
    balance: Number(data.result) / 10 ** 18,
    fecha: new Date().toISOString(),
  });
});

app.get("/api/faucet/:address/:amount", async (req: Request, res: Response) => {
  const { address, amount } = req.params;
  // Validar que sea una dirección Ethereum válida
  if (!ethers.isAddress(address)) {
    return res.status(400).json({ error: "Dirección inválida" });
  }

  try {
    const provider = new ethers.JsonRpcProvider(process.env.URL_NODO);
    const ruta = process.env.KEYSTORE_FILE as string;
    const rutaData = await fs.readFile(ruta, "utf8");

    const wallet = await ethers.Wallet.fromEncryptedJson(
      rutaData,
      process.env.KEYSTORE_PASS as string
    );
    const walletConnected = wallet.connect(provider);
    const tx = await walletConnected.sendTransaction({
      to: address,
      value: ethers.parseEther(amount),
    });
    console.log("address: ", address, "amount: ", amount);

    const txDescription = await tx.wait();

    const balance = await provider.getBalance(address);

    res.json({
      txDescription,
      address,
      amount,
      balance: Number(balance) / 10 ** 18,
      fecha: new Date().toISOString(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ocurrió un error en el servidor" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
