"use client";
import { useClickAuth } from "../../src/hooks/useClickAuth";
import { Button } from "../../components/ui/button";
import { useWallet } from "../../src/hooks/useWallet";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ClickAuthPage() {
  const { contractId } = useWallet();
  const { clickCount, loading, error, handleClick } = useClickAuth();
  const router = useRouter();

  if (!contractId) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            Please connect your wallet first
          </h2>
          <Button onClick={() => router.push("/login")}>Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-center text-3xl font-bold">Click Auth Demo</h2>
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-lg mb-2">Current Click Count:</p>
            <p className="text-3xl font-bold text-blue-600">
              {clickCount ?? "Loading..."}
            </p>
          </div>

          <Button onClick={handleClick} disabled={loading} className="w-full">
            {loading ? "Processing..." : "Click Me!"}
          </Button>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <div className="text-center text-sm text-gray-600">
            <p>
              This demonstrates contract interaction with passkey authentication
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
