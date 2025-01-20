import { Request, Response } from "express";
import { createDockerComposeFile, getNodeLogs } from "../utils/dockerManager";

export async function createDockerCompose(req: Request, res: Response) {
  const { networkName, chainId, nodeCount, bootnodeEnode } = req.body;
  try {
    createDockerComposeFile(networkName, chainId, nodeCount, bootnodeEnode);
    res
      .status(200)
      .json({ message: "Docker Compose file created successfully." });
  } catch (error) {
    if (error instanceof Error) {
      res
        .status(500)
        .json({
          message: `Error creating Docker Compose file: ${error.message}`,
        });
    } else {
      res
        .status(500)
        .json({
          message: "Unknown error occurred while creating Docker Compose file.",
        });
    }
  }
}

export async function getDockerLogs(req: Request, res: Response) {
  const { networkName, nodeName } = req.params;
  try {
    const logs = getNodeLogs(networkName, nodeName);
    res.status(200).json({ logs });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: "Unknown error occurred" });
    }
  }
}
