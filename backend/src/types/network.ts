export interface Node {
  nodeName: string;
  port: number;
  address: string;
  nodeType: NodeType;
}

export interface Network {
  networkName: string;
  chainId: number;
  blockTime: number;
  bootnodeEnode: string;
  nodes: Node[];
  alloc?: { [address: string]: { balance: string } };
}

type NodeType = "bootnode" | "bootstrap" | "signer" | "member" | "rpc";
