import fs from "fs";
import yaml from "js-yaml";
import path from "path";
import { config } from "../config/config";
import { execSync } from "child_process";
import {
  generateGenesis,
  addYamlServiceWithFlags,
} from "../utils/configGenerator";
import { getNetworks } from "../utils/networkManager";
import { Node } from "../types/network";

type NodeType = "bootnode" | "bootstrap" | "signer" | "member" | "rpc";

const networksDir = path.join(config.paths.configs, "networks");
const networksPath = path.join(networksDir, "networks.json");

export async function startNode(networkName: string, nodeName: string) {
  const networkDir = path.join(networksDir, networkName);
  const dockerComposeFile = path.join(
    networkDir,
    `${networkName}_docker-compose.yml`
  );
  const projectName = networkName.toLowerCase().replace(/[^a-z0-9_-]/g, "");

  try {
    execSync(
      `docker-compose -p ${projectName} -f ${dockerComposeFile} up -d ${nodeName}`
    );
    console.log(`Node ${nodeName} started successfully.`);
  } catch (error: any) {
    console.error(`Error starting node: ${error.message}`);
    throw new Error(`Error starting node: ${error.message}`);
  }
}

export async function stopNode(networkName: string, nodeName: string) {
  const networkDir = path.join(config.paths.configs, "networks", networkName);

  const dockerComposeFile = path.join(
    networkDir,
    `${networkName}_docker-compose.yml`
  );

  const projectName = networkName.toLowerCase().replace(/[^a-z0-9_-]/g, "");

  try {
    execSync(
      `docker-compose -p ${projectName} -f ${dockerComposeFile} stop ${nodeName}`
    );
    console.log(`Node ${nodeName} stopped successfully.`);
  } catch (error: any) {
    console.error(`Error stopping node: ${error.message}`);
    throw new Error(`Error stopping node: ${error.message}`);
  }
}

export async function removeNode(networkName: string, nodeName: string) {
  const networkDir = path.join(config.paths.configs, "networks", networkName);
  const dockerComposeFile = path.join(
    networkDir,
    `${networkName}_docker-compose.yml`
  );
  const projectName = networkName.toLowerCase().replace(/[^a-z0-9_-]/g, "");

  try {
    // Detener el nodo si está en ejecución
    execSync(
      `docker-compose -p ${projectName} -f ${dockerComposeFile} down ${nodeName}`
    );
    console.log(`Node ${nodeName} stopped successfully.`);

    // Eliminar el servicio del archivo Docker Compose
    removeService(dockerComposeFile, nodeName);

    // Remover el nodo de networks.json
    const networks = getNetworks();
    const existingNetwork = networks.find(
      (net) => net.networkName === networkName
    );
    if (!existingNetwork) {
      throw new Error(`Network ${networkName} does not exist.`);
    }

    const nodeIndex = existingNetwork.nodes.findIndex(
      (node) => node.nodeName === nodeName
    );
    if (nodeIndex === -1) {
      throw new Error(
        `Node ${nodeName} does not exist in network ${networkName}.`
      );
    }

    // Guardamos la address para limpiar el alloc
    const nodeAddress = existingNetwork.nodes[nodeIndex].address.toLowerCase();

    // Remover el nodo de la lista de nodos
    existingNetwork.nodes.splice(nodeIndex, 1);

    // Remover la asignación del nodo en alloc
    if (existingNetwork.alloc && existingNetwork.alloc[nodeAddress]) {
      delete existingNetwork.alloc[nodeAddress];
    }

    // Reconstruir la lista de signers
    // (se asume que todos los nodos en existingNetwork.nodes siguen siendo validadores)
    const signers = existingNetwork.nodes.map(
      (n) => "0x" + n.address.toLowerCase()
    );

    // Actualizar genesis.json con la nueva lista de signers
    generateGenesis(
      networkName,
      existingNetwork.chainId,
      existingNetwork.blockTime,
      signers,
      existingNetwork.alloc
    );

    // Escribir de vuelta networks.json
    fs.writeFileSync(networksPath, JSON.stringify(networks, null, 2));
    console.log(`Node ${nodeName} removed from networks.json.`);

    // Eliminar los archivos del nodo
    const nodeDir = path.join(networkDir, nodeName);
    if (fs.existsSync(nodeDir)) {
      fs.rmSync(nodeDir, { recursive: true, force: true });
      console.log(`Node directory ${nodeDir} deleted.`);
    }
  } catch (error: any) {
    console.error(`Error removing node: ${error.message}`);
    throw new Error(`Error removing node: ${error.message}`);
  }
}

function getNodeFlags(
  params: {
    networkNodeDir: string;
    chainId: number;
    ipcPath: string;
    port: number;
    enr?: string;
    address?: string;
    httpIp?: string;
    httpPort?: string;
    verbosity?: string;
  },
  nodeType: NodeType
): string[] {
  const verbosity = params.verbosity || "3";

  const types: Record<NodeType, (p: typeof params) => string[]> = {
    bootnode: (p) => [
      "--datadir",
      "/root/.ethereum",
      "--networkid",
      p.chainId.toString(),
      "--port",
      p.port.toString(),
      "--nodekeyhex",
      p.enr || "",
      "--verbosity",
      verbosity,
    ],
    bootstrap: (p) => [
      "--datadir",
      "/root/.ethereum",
      "--networkid",
      p.chainId.toString(),
      "--ipcpath",
      p.ipcPath,
      "--port",
      p.port.toString(),
      //"--discovery.v5",
      "--verbosity",
      verbosity,
    ],
    signer: (p) => [
      "--datadir",
      "/root/.ethereum",
      "--port",
      p.port.toString(),
      `--bootnodes=${p.enr ? `"${p.enr}"` : '""'}`,
      "--networkid",
      p.chainId.toString(),
      "--unlock",
      p.address || "",
      // En vez de usar p.networkNodeDir/password.txt, usar ruta interna del contenedor:
      "--password",
      "/root/.ethereum/password.txt",
      "--mine",
      "--miner.etherbase",
      p.address || "",
      "--ipcpath",
      p.ipcPath,
      //"--discovery.v5",
      "--verbosity",
      verbosity,
    ],
    member: (p) => [
      "--datadir",
      "/root/.ethereum",
      "--networkid",
      p.chainId.toString(),
      "--port",
      p.port.toString(),
      `--bootnodes=${p.enr ? `"${p.enr}"` : '""'}`,
      "--networkid",
      p.chainId.toString(),
      "--unlock",
      p.address || "",
      // Usar la ruta interna del contenedor
      "--password",
      "/root/.ethereum/password.txt",
      "--ipcdisable",
      "--verbosity",
      verbosity,
    ],
    rpc: (p) => [
      "--datadir",
      "/root/.ethereum",
      "--networkid",
      p.chainId.toString(),
      "--port",
      p.port.toString(),
      `--bootnodes=${p.enr ? `"${p.enr}"` : '""'}`,
      "--ipcpath",
      p.ipcPath,
      //"--discovery.v5",
      "--http",
      "--http.addr",
      p.httpIp || "0.0.0.0",
      "--http.port",
      p.httpPort || "8545",
      "--http.corsdomain",
      '"*"',
      "--http.vhosts",
      '"*"',
      "--verbosity",
      verbosity,
    ],
  };

  return types[nodeType](params);
}

export function addNode(
  networkName: string,
  nodeName: string,
  password: string,
  nodeType: NodeType,
  initialBalance?: string
) {
  // 1) Leer networks.json
  const networks = getNetworks();
  const existingNetwork = networks.find((n) => n.networkName === networkName);
  if (!existingNetwork) {
    throw new Error(`Network ${networkName} does not exist!`);
  }

  const networkDir = path.join(config.paths.configs, "networks", networkName);
  const nodeDir = path.join(networkDir, nodeName);
  if (!fs.existsSync(nodeDir)) {
    fs.mkdirSync(nodeDir, { recursive: true });
  }

  // 2) Crear cuenta del nodo
  const passwordFilePath = path.join(nodeDir, "password.txt");
  fs.writeFileSync(passwordFilePath, password);

  execSync(
    `geth --datadir ${nodeDir} account new --password ${passwordFilePath}`
  );

  // 3) Recuperar la clave pública
  const keystoreDir = path.join(nodeDir, "keystore");
  const keystoreFiles = fs.readdirSync(keystoreDir);
  const keyfile = keystoreFiles.find((file) => file.includes("UTC--"));
  if (!keyfile) {
    throw new Error(`Keyfile not found in ${keystoreDir}.`);
  }
  const keystorePath = path.join(keystoreDir, keyfile);
  const keystore = JSON.parse(fs.readFileSync(keystorePath, "utf-8"));
  const rawPublicKey = keystore.address.toLowerCase(); // Sin prefijo
  const publicKey = "0x" + rawPublicKey;

  // 4) Actualizar alloc y genesis.json
  // Aseguramos que alloc exista
  if (!existingNetwork.alloc) {
    existingNetwork.alloc = {};
  }

  // Si hay initialBalance, añadir balance al alloc
  if (initialBalance !== "" && initialBalance !== undefined) {
    existingNetwork.alloc[publicKey] = {
      balance: initialBalance,
    };
  }

  // Preparar la lista de signers existente
  const signers = existingNetwork.nodes
    .filter((n) => n.nodeType === "signer")
    .map((n) => "0x" + n.address.toLowerCase());

  // Si este nodo es signer y no estaba en la lista, añadirlo
  if (nodeType === "signer" && !signers.includes(rawPublicKey)) {
    signers.push(rawPublicKey);
  }

  // Ahora generamos el genesis siempre, con o sin signer
  generateGenesis(
    networkName,
    existingNetwork.chainId,
    existingNetwork.blockTime,
    signers,
    existingNetwork.alloc
  );

  // Generar flags dinámicamente con getNodeFlags
  const nodeFlags = getNodeFlags(
    {
      networkNodeDir: nodeDir,
      chainId: existingNetwork.chainId,
      ipcPath: "/root/.ethereum/geth.ipc",
      port: 30303, // o tu forma de asignar/descubrir puertos
      enr: existingNetwork.bootnodeEnode, // para --bootnodes
      address: publicKey,
      httpIp: "0.0.0.0",
      httpPort: "8545",
      verbosity: "3",
    },
    nodeType
  );

  // Agregar el nodo a docker-compose usando entrypoint + flags
  const bootnodeEnode = existingNetwork.bootnodeEnode || "";
  addYamlServiceWithFlags(
    path.join(networkDir, `${networkName}_docker-compose.yml`),
    existingNetwork.chainId,
    nodeName,
    bootnodeEnode,
    publicKey,
    nodeFlags
  );

  // 6) Levantar el contenedor
  const projectName = networkName.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  const dockerComposeFile = path.join(
    networkDir,
    `${networkName}_docker-compose.yml`
  );
  execSync(
    `docker-compose -p ${projectName} -f ${dockerComposeFile} up -d ${nodeName}`
  );

  // 7) Consultar docker inspect para saber qué puertos se asignaron
  const psOutput = execSync(
    `docker-compose -p ${projectName} -f ${dockerComposeFile} ps -q ${nodeName}`
  )
    .toString()
    .trim();
  const containerId = psOutput.split("\n")[0] || "";
  let hostPort = 0;
  if (containerId) {
    const inspectOutput = execSync(`docker inspect ${containerId}`).toString();
    const containerInfo = JSON.parse(inspectOutput)[0];
    if (
      containerInfo.NetworkSettings.Ports &&
      containerInfo.NetworkSettings.Ports["30303/tcp"] &&
      containerInfo.NetworkSettings.Ports["30303/tcp"].length > 0
    ) {
      hostPort = parseInt(
        containerInfo.NetworkSettings.Ports["30303/tcp"][0].HostPort,
        10
      );
    }
  }

  // 8) Guardar en networks.json
  const newNode: Node = {
    nodeName,
    port: hostPort,
    address: publicKey,
    nodeType,
  };
  existingNetwork.nodes.push(newNode);

  const networksPath = path.join(
    config.paths.configs,
    "networks",
    "networks.json"
  );
  fs.writeFileSync(networksPath, JSON.stringify(networks, null, 2));

  console.log(`Node ${nodeName} started at port ${hostPort}.`);
}

export function addNodeToNetwork(networkName: string, node: Node) {
  const networks = getNetworks();
  const networkIndex = networks.findIndex(
    (network) => network.networkName === networkName
  );

  if (networkIndex === -1) {
    throw new Error(`Network ${networkName} does not exist.`);
  }

  networks[networkIndex].nodes.push(node);
  fs.writeFileSync(networksPath, JSON.stringify(networks, null, 2));
}

function removeService(dockerComposeFile: string, nodeName: string) {
  try {
    const fileContent = fs.readFileSync(dockerComposeFile, "utf8");
    const doc = yaml.load(fileContent) as any;

    // Borrar la key correspondiente del YAML y guardar el archivo
    if (doc.services && doc.services[nodeName]) {
      delete doc.services[nodeName];
      fs.writeFileSync(dockerComposeFile, yaml.dump(doc));
      console.log(`Node ${nodeName} removed from docker-compose.yml.`);
    } else {
      console.log(`Node ${nodeName} does not exist in docker-compose.yml.`);
    }
  } catch (error: any) {
    console.error(
      `Error removing service ${nodeName} from docker-compose.yml: ${error.message}`
    );
    throw new Error(`Error removing service ${nodeName}: ${error.message}`);
  }
}
