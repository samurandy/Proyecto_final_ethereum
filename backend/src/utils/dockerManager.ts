import { execSync } from "child_process";
import path from "path";
import { config } from "../config/config";
import fs from "fs";

export function createDockerComposeFile(
  networkName: string,
  chainId: number,
  nodeCount: number,
  bootnodeEnode: string
) {
  const networkDir = path.join(config.paths.configs, "networks", networkName);
  const dockerComposeFilePath = path.join(
    networkDir,
    `${networkName}_docker-compose.yml`
  );

  const services: Record<string, any> = {
    bootnode: {
      image: "ethereum/client-go:alltools-v1.11.5",
      command: `bootnode --nodekey /root/.ethereum/boot.key --verbosity 9 --addr :30301`,
      volumes: [`${networkDir}/bootnode:/root/.ethereum`],
      ports: ["30301:30301"],
    },
  };

  for (let i = 1; i <= nodeCount; i++) {
    services[`node${i}`] = {
      image: "ethereum/client-go:alltools-v1.11.5",
      command: `geth --networkid ${chainId} --syncmode full --datadir /root/.ethereum --http --http.addr 0.0.0.0 --http.port ${
        8545 + i
      } --http.api admin,eth,miner,net,txpool,personal,web3 --allow-insecure-unlock --unlock "0x<ADDRESS>" --password /root/.ethereum/password.txt --port ${
        30303 + i
      } --bootnodes ${bootnodeEnode}`,
      volumes: [`${networkDir}/node${i}:/root/.ethereum`],
      ports: [`${30303 + i}:${30303 + i}`, `${8545 + i}:${8545 + i}`],
    };
  }

  const dockerCompose = {
    version: "3.7",
    services,
  };

  try {
    fs.writeFileSync(
      dockerComposeFilePath,
      JSON.stringify(dockerCompose, null, 2)
    );
  } catch (error: any) {
    console.error(`Error generating Docker Compose file: ${error.message}`);
    throw new Error(`Error generating Docker Compose file: ${error.message}`);
  }
}

export function getNodeLogs(networkName: string, nodeName: string): string {
  const networkDir = path.join(config.paths.configs, "networks", networkName);
  const dockerComposeFile = path.join(
    networkDir,
    `${networkName}_docker-compose.yml`
  );
  const projectName = networkName.toLowerCase().replace(/[^a-z0-9_-]/g, "");

  try {
    const logs = execSync(
      `docker-compose -p ${projectName} -f ${dockerComposeFile} logs ${nodeName}`
    ).toString();
    return logs;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Error getting logs for node ${nodeName}: ${error.message}`
      );
    } else {
      throw new Error("Unknown error occurred while getting node logs.");
    }
  }
}
