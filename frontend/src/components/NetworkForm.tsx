import React, { useState } from "react";

interface NetworkFormProps {
  onCreateNetwork: (networkName: string, chainId: number, blockTime: number) => void;
}

const NetworkForm: React.FC<NetworkFormProps> = ({ onCreateNetwork }) => {
  const [networkName, setNetworkName] = useState("");
  const [chainId, setChainId] = useState(1);
  const [blockTime, setBlockTime] = useState(12);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateNetwork(networkName, chainId, blockTime);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block">Network Name</label>
        <input
          type="text"
          value={networkName}
          onChange={(e) => setNetworkName(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      <div>
        <label className="block">Chain ID</label>
        <input
          type="number"
          value={chainId}
          onChange={(e) => setChainId(Number(e.target.value))}
          className="w-full p-2 border rounded"
        />
      </div>
      <div>
        <label className="block">Block Time (Seconds)</label>
        <input
          type="number"
          value={blockTime}
          onChange={(e) => setBlockTime(Number(e.target.value))}
          className="w-full p-2 border rounded"
        />
      </div>
      <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
        Create Network
      </button>
    </form>
  );
};

export default NetworkForm;
