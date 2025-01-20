import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { config } from "../config/config";
import { getLocalIPAddress } from "../utils/ipManager";

/**
 * Construye el extraData para clique:
 * 1) 32 bytes de ceros.
 * 2) Concatenar direcciones de signers (sin '0x', 20 bytes -> 40 hex cada una).
 * 3) Rellenar con ceros hasta 512 bytes (1024 hex).
 */
export function buildCliqueExtraData(signers: string[]): string {
  // 1) 32 bytes (64 hex chars) de 'vanity' inicial
  let extraData = "0".repeat(64);

  // 2) Apéndice de direcciones (cada signer son 20 bytes => 40 hex), sin "0x"
  for (const signerAddress of signers) {
    const cleaned = signerAddress.replace(/^0x/, "").toLowerCase();
    extraData += cleaned;
  }

  // 3) 65 bytes (130 hex) de espacio para la firma (v, r, s)
  const signaturePlaceholder = "0".repeat(130);
  extraData += signaturePlaceholder;

  // Retorna el resultado con un único "0x" al inicio
  return `0x${extraData}`;
}

export function generateGenesis(
  networkName: string,
  chainId: number,
  blockTime: number,
  signers: string[],
  alloc?: { [address: string]: { balance: string } }
) {
  const networkDir = path.join(config.paths.configs, "networks", networkName);

  // Asegurar que el directorio de la red existe
  if (!fs.existsSync(networkDir)) {
    fs.mkdirSync(networkDir, { recursive: true });
    console.log(`Directorio de la red creado en: ${networkDir}`);
  }

  const cleanedSigners = signers.map((signer) =>
    signer.replace(/^0x/, "").toLowerCase()
  );

  const genesis = {
    config: {
      chainId: chainId,
      homesteadBlock: 0,
      eip150Block: 0,
      eip155Block: 0,
      eip158Block: 0,
      byzantiumBlock: 0,
      constantinopleBlock: 0,
      petersburgBlock: 0,
      istanbulBlock: 0,
      berlinBlock: 0,
      londonBlock: 0,
      clique: {
        period: blockTime,
        epoch: 30000,
      },
    },
    difficulty: "1",
    gasLimit: "8000000",
    extraData: buildCliqueExtraData(cleanedSigners),
    alloc: alloc || {},
  };

  const genesisFile = path.join(networkDir, "genesis.json");

  try {
    fs.writeFileSync(genesisFile, JSON.stringify(genesis, null, 2));
    console.log(`Genesis file generated at ${genesisFile}`);
  } catch (error: any) {
    console.error(`Error generating genesis file: ${error.message}`);
    throw new Error(`Error generating genesis file: ${error.message}`);
  }
}

export function generateEnode(
  publicKey: string,
  ip: string,
  port: number
): string {
  if (publicKey.length !== 128) {
    throw new Error(
      "La clave pública no tiene la longitud esperada de 128 caracteres hexadecimales."
    );
  }
  return `enode://${publicKey}@${ip}:${port}`;
}

export async function generateDockerCompose(networkName: string) {
  const networkDir = path.join(config.paths.configs, "networks", networkName);
  const dockerComposeFilePath = path.join(
    networkDir,
    `${networkName}_docker-compose.yml`
  );

  const localIP = getLocalIPAddress();

  const services: any = {
    services: {
      bootnode: {
        image: "ethereum/client-go:alltools-v1.11.5",
        command: `bootnode --nodekey /root/.ethereum/boot.key --addr 0.0.0.0:30303 --nat extip:${localIP} --verbosity 9`,
        volumes: [`./bootnode:/root/.ethereum`],
        ports: ["30303:30303", "30303:30303/udp"],
        networks: ["custom_bridge"], //Docker se encarga de las IPs con la red “custom_bridge”
      },
    },
    networks: {
      custom_bridge: {
        driver: "bridge",
      },
    },
  };

  try {
    fs.writeFileSync(dockerComposeFilePath, JSON.stringify(services, null, 2));
  } catch (error: any) {
    console.error(`Error generating Docker Compose file: ${error.message}`);
    throw new Error(`Error generating Docker Compose file: ${error.message}`);
  }
}

/** Convierte las barras invertidas de Windows en barras normales. */
function toPosix(localPath: string): string {
  return localPath.replace(/\\/g, "/");
}

export function addYamlServiceWithFlags(
  dockerComposeFile: string,
  chainId: number,
  nodeName: string,
  bootnodeEnode: string,
  address: string,
  nodeFlags: string[]
) {
  try {
    const doc: any = fs.existsSync(dockerComposeFile)
      ? yaml.load(fs.readFileSync(dockerComposeFile, "utf8")) || {}
      : {};

    if (!doc.services) doc.services = {};
    if (!doc.networks) doc.networks = { custom_bridge: { driver: "bridge" } };
    if (doc.version) delete doc.version;

    // Rutas correctas: .../configs/networks/<networkName>/genesis.json
    // nodos en: .../configs/networks/<networkName>/<nodeName>
    const composeDir = path.dirname(dockerComposeFile);
    // => .../configs/networks/<networkName>/genesis.json
    const genesisFileLocal = path.join(composeDir, "genesis.json");
    // => .../configs/networks/<networkName>/<nodeName>
    const nodeDirLocal = path.join(composeDir, nodeName);
    const passwordFileLocal = path.join(nodeDirLocal, "password.txt");

    // Forzar uso de "/" en Windows
    const genesisFile = toPosix(path.resolve(genesisFileLocal));
    const nodeDir = toPosix(path.resolve(nodeDirLocal));
    const passwordFile = toPosix(path.resolve(passwordFileLocal));
    console.log("Docker Compose Directory:", composeDir);
    console.log("Genesis File:", genesisFile);
    console.log("Node Directory:", nodeDir);
    console.log("Password File:", passwordFile);

    let usedPorts = new Set<number>();

    function getUniquePort(basePort: number, usedPorts: Set<number>) {
      let port;
      do {
        port = basePort + Math.floor(Math.random() * 10000);
      } while (usedPorts.has(port));
      usedPorts.add(port);
      return port;
    }

    const tcpPort = getUniquePort(30303, usedPorts);
    const udpPort = getUniquePort(30303, usedPorts);
    const rpcPort = getUniquePort(8545, usedPorts);
    doc.services[nodeName] = {
      image: "ethereum/client-go:alltools-v1.11.5",
      entrypoint: [
        "sh",
        "-c",
        // Ejecutamos geth init con genesis.json, luego lanzamos geth con las flags
        `geth init --datadir /root/.ethereum /root/genesis.json && geth ${nodeFlags.join(
          " "
        )}`,
      ],
      // Usamos long syntax para bind mounts
      volumes: [
        {
          type: "bind",
          source: path.resolve(nodeDir).replace(/\\/g, "/"),
          target: "/root/.ethereum",
        },
        {
          type: "bind",
          source: path.resolve(passwordFile).replace(/\\/g, "/"),
          target: "/root/.ethereum/password.txt",
        },
        {
          type: "bind",
          source: path.resolve(genesisFile).replace(/\\/g, "/"),
          target: "/root/genesis.json",
        },
      ],
      ports: [
        `${tcpPort}:30303`, // TCP
        `${udpPort}:30303/udp`, // UDP
        `${rpcPort}:8545`, // RPC
      ],
      networks: ["custom_bridge"],
    };

    const yamlContent = yaml.dump(doc);
    fs.writeFileSync(dockerComposeFile, yamlContent, "utf8");
    console.log(
      `Node ${nodeName} added correctly with long-syntax volumes to docker-compose.yml.`
    );
  } catch (error: any) {
    console.error(
      `Error adding node ${nodeName} to docker-compose.yml: ${error.message}`
    );
    throw new Error(`Error adding node ${nodeName}: ${error.message}`);
  }
}
