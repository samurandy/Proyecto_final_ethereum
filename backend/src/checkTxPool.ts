import Web3 from "web3";

const web3 = new Web3("http://localhost:17759"); // URL del nodo RPC

async function checkPendingTransactions(): Promise<void> {
  try {
    // Obtener las transacciones pendientes
    const pendingTransactions = await web3.eth.getBlock("pending", true);
    console.log("Pending Transactions: ", pendingTransactions);
  } catch (error) {
    console.error("Error:", error);
  }
}

checkPendingTransactions();
