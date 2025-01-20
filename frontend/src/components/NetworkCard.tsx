import React from "react";

interface NetworkCardProps {
  networkName: string;
  chainId: number;
  blockTime: number;
}

const NetworkCard: React.FC<NetworkCardProps> = ({ networkName, chainId, blockTime }) => {
  return (
    <div className="p-4 border rounded shadow">
      <h2 className="text-xl font-bold">{networkName}</h2>
      <p>Chain ID: {chainId}</p>
      <p>Block Time: {blockTime} seconds</p>
    </div>
  );
};

export default NetworkCard;
