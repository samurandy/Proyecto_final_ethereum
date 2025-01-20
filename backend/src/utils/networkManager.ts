import fs from "fs";
import path from "path";
import { exec as execCallback, execSync } from "child_process";
import util from "util";
import { config } from "../config/config";
import {
  generateDockerCompose,
  generateEnode,
  generateGenesis,
} from "../utils/configGenerator";
import { Network, Node } from "../types/network";

const exec = util.promisify(execCallback);

const networksDir = path.join(config.paths.configs, "networks");
const networksPath = path.join(networksDir, "networks.json");

function ensureNetworksDirExists() {
  if (!fs.existsSync(networksDir)) {
    console.log(`Creating networks directory: ${networksDir}`);
    fs.mkdirSync(networksDir, { recursive: true });
  } else {
    console.log(`Networks directory already exists: ${networksDir}`);
  }
}

function ensureNetworksFileExists() {
  ensureNetworksDirExists();
  if (!fs.existsSync(networksPath)) {
    console.log(`Creating networks.json file: ${networksPath}`);
    fs.writeFileSync(networksPath, JSON.stringify([]));
  } else {
    console.log(`networks.json file already exists: ${networksPath}`);
  }
}

export function getNetworks(): Network[] {
  ensureNetworksFileExists();
  return JSON.parse(fs.readFileSync(networksPath, "utf-8"));
}

export function addNetworkToJson(network: Network) {
  const networks = getNetworks();
  networks.push(network);
  fs.writeFileSync(networksPath, JSON.stringify(networks, null, 2));
}

export function removeNetwork(networkName: string) {
  // Detener y eliminar los contenedores Docker asociados
  const networkDir = path.join(networksDir, networkName);
  const dockerComposeFile = path.join(
    networkDir,
    `${networkName}_docker-compose.yml`
  );
  const projectName = networkName.toLowerCase().replace(/[^a-z0-9_-]/g, "");

  try {
    execSync(`docker-compose -p ${projectName} -f ${dockerComposeFile} down`);
    console.log(
      `Docker containers for network ${networkName} stopped and removed successfully.`
    );
  } catch (error: any) {
    console.error(
      `Error stopping and removing Docker containers: ${error.message}`
    );
  }

  // Eliminar el directorio de la red
  if (fs.existsSync(networkDir)) {
    fs.rmSync(networkDir, { recursive: true, force: true });
    console.log(`Network directory ${networkDir} removed successfully.`);
  } else {
    console.log(`Network directory ${networkDir} does not exist.`);
  }

  // Obtener las redes y filtrar la red que se va a eliminar
  const networks = getNetworks();
  console.log("Networks before filtering:", JSON.stringify(networks, null, 2));

  const updatedNetworks = networks.filter(
    (network) => network.networkName.toLowerCase() !== networkName.toLowerCase()
  );
  console.log(
    "Networks after filtering:",
    JSON.stringify(updatedNetworks, null, 2)
  );

  // Escribir el archivo networks.json actualizado
  try {
    fs.writeFileSync(networksPath, JSON.stringify(updatedNetworks, null, 2));
    console.log(
      `Network ${networkName} removed from networks.json successfully.`
    );
  } catch (error: any) {
    console.error(`Error updating networks.json: ${error.message}`);
    throw new Error(`Error updating networks.json: ${error.message}`);
  }
}

export async function startNetwork(networkName: string) {
  const networkDir = path.join(networksDir, networkName);
  const dockerComposeFile = path.join(
    networkDir,
    `${networkName}_docker-compose.yml`
  );
  const projectName = networkName.toLowerCase().replace(/[^a-z0-9_-]/g, "");

  try {
    await exec(
      `docker-compose -p ${projectName} -f ${dockerComposeFile} start`
    );
    console.log(`Network ${networkName} started successfully.`);
  } catch (error: any) {
    console.error(`Error starting network: ${error.message}`);
    throw new Error(`Error starting network: ${error.message}`);
  }
}

export async function stopNetwork(networkName: string) {
  const networkDir = path.join(networksDir, networkName);
  const dockerComposeFile = path.join(
    networkDir,
    `${networkName}_docker-compose.yml`
  );
  const projectName = networkName.toLowerCase().replace(/[^a-z0-9_-]/g, "");

  try {
    await exec(`docker-compose -p ${projectName} -f ${dockerComposeFile} stop`);
    console.log(`Network ${networkName} stopped successfully.`);
  } catch (error: any) {
    console.error(`Error stopping network: ${error.message}`);
    throw new Error(`Error stopping network: ${error.message}`);
  }
}

export function getNetworkStatus(networkName: string): any {
  const networkDir = path.join(networksDir, networkName);
  const dockerComposeFile = path.join(
    networkDir,
    `${networkName}_docker-compose.yml`
  );
  const projectName = networkName.toLowerCase().replace(/[^a-z0-9_-]/g, "");

  try {
    const result = execSync(
      `docker-compose -p ${projectName} -f ${dockerComposeFile} ps --services --filter "status=running"`
    );
    const runningServices = result.toString().trim().split("\n");
    return { runningServices };
  } catch (error: any) {
    console.error(`Error getting network status: ${error.message}`);
    throw new Error(`Error getting network status: ${error.message}`);
  }
}

export async function createNetwork(
  networkName: string,
  chainId: number,
  blockTime: number
) {
  const networkDir = path.join(config.paths.configs, "networks", networkName);

  try {
    // Crear el directorio de la red si no existe
    if (!fs.existsSync(networkDir)) {
      fs.mkdirSync(networkDir, { recursive: true });
      console.log(`Directorio de la red creado en: ${networkDir}`);
    } else {
      console.log(`Directorio de la red ya existe: ${networkDir}`);
    }

    // Crear el directorio para boot.key
    const bootnodeDir = path.join(networkDir, "bootnode");
    if (!fs.existsSync(bootnodeDir)) {
      fs.mkdirSync(bootnodeDir, { recursive: true });
    }

    // Generar la clave del bootnode
    await exec(
      `docker run --rm -v ${bootnodeDir}:/root/.ethereum ethereum/client-go:alltools-v1.11.5 bootnode -genkey /root/.ethereum/boot.key`
    );

    // Obtener la Clave Pública del Bootnode
    const publicKey = (
      await exec(
        `docker run --rm -v ${bootnodeDir}:/root/.ethereum ethereum/client-go:alltools-v1.11.5 bootnode -nodekey /root/.ethereum/boot.key -writeaddress`
      )
    ).stdout.trim();

    // Generar el archivo Docker Compose
    await generateDockerCompose(networkName);

    // Levantar el contenedor del bootnode
    await activateNetworkManager(networkName);

    //Esperar a que el contenedor esté corriendo
    const projectName = networkName.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    await waitForContainerRunning(`${projectName}-bootnode-1`);

    // Levantar el contenedor del bootnode
    const bootnodeIp = await getContainerIp(`${projectName}-bootnode-1`);

    // Generar el enode con la IP del bootnode
    const bootnodeEnode = generateEnode(publicKey, bootnodeIp, 30303);

    // Agregar la red a networks.json
    const nodes: Node[] = [
      {
        nodeName: "bootnode",
        port: 30303,
        address: publicKey,
        nodeType: "bootnode",
      },
    ];

    addNetworkToJson({
      networkName,
      chainId,
      blockTime,
      bootnodeEnode,
      nodes,
    });
  } catch (error: any) {
    console.error(`Error configuring network: ${error.message}`);
    throw new Error(`Error configuring network: ${error.message}`);
  }
}

// Verificar que el contenedor está en estado "running"
async function waitForContainerRunning(
  containerAlias: string,
  timeout = 30000
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      // Usar comillas dobles dentro de la plantilla para evitar errores de interpretación
      const command = `docker inspect -f "{{json .State}}" ${containerAlias.toLowerCase()}`;
      const containerStatus = (await exec(command)).stdout.trim();

      const state = JSON.parse(containerStatus); // Parsear el JSON del estado

      if (state.Status === "running") {
        return; // El contenedor está corriendo
      }
    } catch (error: any) {
      // Manejo de errores con un mensaje claro
      console.log(
        `Error verificando contenedor ${containerAlias}: ${error.message}`
      );
    }

    // Esperar 500ms antes de volver a intentar
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(
    `Timeout: El contenedor ${containerAlias} no está en estado "running" después de ${
      timeout / 1000
    } segundos.`
  );
}

// Obtener la IP del contenedor una vez esté corriendo
async function getContainerIp(containerName: string): Promise<string> {
  try {
    const ip = (
      await exec(
        `docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ${containerName}`
      )
    ).stdout
      .trim()
      .replace(/'/g, "");

    if (!ip) {
      throw new Error("No se pudo obtener la IP del contenedor.");
    }

    return ip;
  } catch (error: any) {
    throw new Error(
      `Error al obtener la IP del contenedor ${containerName}: ${error.message}`
    );
  }
}

async function activateNetworkManager(networkName: string) {
  const networkDir = path.join(networksDir, networkName);
  const dockerComposeFile = path.join(
    networkDir,
    `${networkName}_docker-compose.yml`
  );
  const projectName = networkName.toLowerCase().replace(/[^a-z0-9_-]/g, "");

  try {
    // Levantar el bootnode utilizando Docker
    await exec(
      `docker-compose -p ${projectName} -f ${dockerComposeFile} up -d bootnode`
    );
  } catch (error: any) {
    console.error(`Error activating network: ${error.message}`);
    throw new Error(`Error activating network: ${error.message}`);
  }
}
