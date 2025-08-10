"use client";
import { useWallet } from "../../src/hooks/useWallet";
import { Button } from "../../components/ui/button";

export default function Dashboard() {
  const { keyId, contractId, disconnect } = useWallet();
  return (
    <div className="p-6 space-y-4">
      <div>Connected: {contractId ? "✅ Yes" : "❌ No"}</div>
      {contractId && (
        <div>
          Contract ID: <code>{contractId}</code>
        </div>
      )}
      {keyId && (
        <div>
          Key ID: <code>{keyId}</code>
        </div>
      )}
      {contractId && (
        <Button onClick={disconnect} variant="destructive">
          Disconnect
        </Button>
      )}
    </div>
  );
}
