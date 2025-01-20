import { Request, Response } from "express";
import {
  createNetwork,
  startNetwork,
  stopNetwork,
  removeNetwork,
  getNetworkStatus,
  getNetworks,
} from "../utils/networkManager";
import fs from "fs";

function getPublicKeyFromKeystore(keystorePath: string): string {
  const keystore = JSON.parse(fs.readFileSync(keystorePath, "utf-8"));
  return keystore.address; // Suponiendo que la clave pública está almacenada en la propiedad `address`
}

export async function getAllNetworks(req: Request, res: Response) {
  try {
    const networks = getNetworks();
    res.status(200).json(networks);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error getting networks: ${error.message}` });
  }
}

export async function createNetworkHandler(req: Request, res: Response) {
  const { networkName, chainId, blockTime } = req.body;
  try {
    // Configurar la red
    await createNetwork(networkName, chainId, blockTime);

    res.status(200).json({
      message: `Network ${networkName} configured and activated successfully.`,
    });
  } catch (error: any) {
    res.status(500).json({
      message: `Error configuring and activating network: ${error.message}`,
    });
  }
}

export async function startNetworkHandler(req: Request, res: Response) {
  const { networkName } = req.body;
  try {
    startNetwork(networkName);
    res
      .status(200)
      .json({ message: `Network ${networkName} started successfully.` });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error starting network: ${error.message}` });
  }
}

export async function stopNetworkHandler(req: Request, res: Response) {
  const { networkName } = req.body;
  try {
    stopNetwork(networkName);
    res
      .status(200)
      .json({ message: `Network ${networkName} stopped successfully.` });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error stopping network: ${error.message}` });
  }
}

export async function removeNetworkHandler(req: Request, res: Response) {
  const { networkName } = req.body;
  try {
    removeNetwork(networkName);
    res
      .status(200)
      .json({ message: `Network ${networkName} removed successfully.` });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error removing network: ${error.message}` });
  }
}

export async function getNetworkStatusHandler(req: Request, res: Response) {
  const { networkName } = req.params;

  if (!networkName) {
    return res.status(400).json({ message: "Network name is required" });
  }

  try {
    const status = getNetworkStatus(networkName);
    res.status(200).json(status);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error getting network status: ${error.message}` });
  }
}
