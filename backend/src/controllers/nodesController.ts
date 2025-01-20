import { Request, Response } from "express";
import { config } from "../config/config";
import path from "path";
import fs from "fs";
import { startNode, stopNode, removeNode, addNode } from "../utils/nodeManager";

function nodeExists(networkName: string, nodeName: string): boolean {
  const networkDir = path.join(config.paths.configs, "networks", networkName);
  const dockerComposeFile = path.join(
    networkDir,
    `${networkName}_docker-compose.yml`
  );
  const dockerComposeContent = fs.readFileSync(dockerComposeFile, "utf-8");
  return dockerComposeContent.includes(nodeName);
}

export async function addNodeHandler(req: Request, res: Response) {
  const { networkName } = req.params;
  const { nodeName, password, nodeType, initialBalance } = req.body;
  try {
    if (nodeExists(networkName, nodeName)) {
      return res.status(400).json({
        message: `Node ${nodeName} already exists in network ${networkName}.`,
      });
    }

    addNode(networkName, nodeName, password, nodeType, initialBalance);
    res.status(200).json({
      message: `Node ${nodeName} added and started successfully in network ${networkName}.`,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: `Error adding node: ${error.message}` });
    } else {
      res
        .status(500)
        .json({ message: "Unknown error occurred while adding node." });
    }
  }
}

export async function startNodeHandler(req: Request, res: Response) {
  const { networkName } = req.params;
  const { nodeName } = req.body;

  if (!nodeName) {
    return res.status(400).json({ message: "nodeName is required" });
  }

  try {
    await startNode(networkName, nodeName);
    return res.status(200).json({
      message: `Node ${nodeName} started successfully in network ${networkName}.`,
    });
  } catch (error: any) {
    console.error(`Error starting node: ${error.message}`);
    return res
      .status(500)
      .json({ message: `Error starting node: ${error.message}` });
  }
}

export async function stopNodeHandler(req: Request, res: Response) {
  const { networkName } = req.params;
  const { nodeName } = req.body;

  if (!nodeName) {
    return res.status(400).json({ message: "nodeName is required" });
  }

  try {
    await stopNode(networkName, nodeName);
    return res.status(200).json({
      message: `Node ${nodeName} stopped successfully in network ${networkName}.`,
    });
  } catch (error: any) {
    console.error(`Error stopping node: ${error.message}`);
    return res
      .status(500)
      .json({ message: `Error stopping node: ${error.message}` });
  }
}

export async function removeNodeHandler(req: Request, res: Response) {
  const { networkName } = req.params;
  const { nodeName } = req.body;

  if (!nodeName) {
    return res.status(400).json({ message: "nodeName is required" });
  }

  try {
    await removeNode(networkName, nodeName);
    return res.status(200).json({
      message: `Node ${nodeName} removed successfully from network ${networkName}.`,
    });
  } catch (error: any) {
    console.error(`Error removing node: ${error.message}`);
    return res
      .status(500)
      .json({ message: `Error removing node: ${error.message}` });
  }
}
