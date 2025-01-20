import React, { useState } from "react";
import NetworkForm from "../components/NetworkForm";
import NodeForm from "../components/NodeForm";
import NetworkCard from "../components/NetworkCard";

const Home: React.FC = () => {
  const [networks, setNetworks] = useState<{ networkName: string; chainId: number; blockTime: number }[]>([]);

  const handleCreateNetwork = (networkName: string, chainId: number, blockTime: number) => {
    setNetworks([...networks, { networkName, chainId, blockTime }]);
  };

  const handleCreateNode = (networkName: string, nodeIndex: number) => {
    console.log(`Creating node ${nodeIndex} for ${networkName}`);
  };

  return (
    <div className="p-8">
      <NetworkForm onCreateNetwork={handleCreateNetwork} />
      <div className="mt-8 space-y-4">
        {networks.map((network, index) => (
          <div key={index}>
            <NetworkCard {...network} />
            <NodeForm networkName={network.networkName} onCreateNode={handleCreateNode} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
