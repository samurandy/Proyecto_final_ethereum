import Web3 from "web3";
import * as fs from "fs";
import * as path from "path";

const web3 = new Web3("http://localhost:17759"); // URL del nodo RPC

// Aumentar los tiempos de espera
web3.eth.transactionPollingTimeout = 1800; // Aumentar a 1800 segundos (30 minutos)
web3.eth.transactionConfirmationBlocks = 50;
web3.eth.transactionBlockTimeout = 100;

// Ruta completa al archivo JSON de la clave privada cifrada
const keyStorePath = path.join(
  "D:",
  "MasterIngenieroBlockchain",
  "Proyecto_final_ethereum",
  "backend",
  "configs",
  "networks",
  "yourNetworkName",
  "signerNode",
  "keystore",
  "UTC--2025-01-14T12-39-14.188744700Z--d146a5f3ac23d80ac4c82d5821ead705fd51cf0a"
);
const password = "yourPassword"; // Contraseña para descifrar el keystore

const keyStore = JSON.parse(fs.readFileSync(keyStorePath, "utf-8"));

async function sendTransaction(): Promise<void> {
  try {
    // Verificar conexión
    const isListening = await web3.eth.net.isListening();
    console.log("Connected to the network:", isListening);

    // Descifra la clave privada
    const account = await web3.eth.accounts.decrypt(keyStore, password);
    const privateKey = account.privateKey;
    const address = account.address;

    // Prepara y envía la transacción
    const nonce = await web3.eth.getTransactionCount(address, "pending");
    console.log("Nonce:", nonce);

    const tx = {
      from: address,
      to: "0x2CBB01a1557Ec5178C5f0f5507a0f7e6C02647d3",
      value: web3.utils.toWei("30", "ether"),
      gas: 21000,
      gasPrice: web3.utils.toWei("20", "gwei"), // Ajusta según sea necesario
      nonce: nonce,
    };

    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);
    console.log("Signed Transaction:", signedTx);

    const receipt = await web3.eth.sendSignedTransaction(
      signedTx.rawTransaction as string
    );
    console.log("Transaction receipt:", receipt);
  } catch (error) {
    console.error("Error:", error);
  }
}

sendTransaction();
