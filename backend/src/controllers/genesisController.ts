import { Request, Response } from "express";
import { generateGenesis } from "../utils/configGenerator";
import fs from "fs";
import path from "path";
import { config } from "../config/config";

export async function createGenesisFile(req: Request, res: Response) {
  const { networkName, chainId, blockTime, alloc } = req.body;
  try {
    const filePath = generateGenesis(networkName, chainId, blockTime, alloc);
    res.status(200).json({ message: "Genesis file created", filePath });
  } catch (error) {
    if (error instanceof Error) {
      res
        .status(500)
        .json({ message: `Error creating genesis file: ${error.message}` });
    } else {
      res
        .status(500)
        .json({
          message: "Unknown error occurred while creating genesis file.",
        });
    }
  }
}

export async function getGenesisConfig(req: Request, res: Response) {
  const { networkName } = req.params;
  const filePath = path.join(
    config.paths.configs,
    "networks",
    networkName,
    "genesis.json"
  );
  if (fs.existsSync(filePath)) {
    const genesisConfig = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    res.status(200).json({ genesisConfig });
  } else {
    res.status(404).json({ message: "Genesis file not found" });
  }
}
