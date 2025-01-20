import React, { useState } from "react";

interface NodeFormProps {
  networkName: string;
  onCreateNode: (networkName: string, nodeIndex: number) => void;
}

const NodeForm: React.FC<NodeFormProps> = ({ networkName, onCreateNode }) => {
  const [nodeIndex, setNodeIndex] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateNode(networkName, nodeIndex);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block">Node Index</label>
        <input
          type="number"
          value={nodeIndex}
          onChange={(e) => setNodeIndex(Number(e.target.value))}
          className="w-full p-2 border rounded"
        />
      </div>
      <button type="submit" className="w-full bg-green-500 text-white p-2 rounded">
        Create Node
      </button>
    </form>
  );
};

export default NodeForm;
