"use client";
import dynamic from "next/dynamic";
import { Button } from "../../components/ui/button";
import { useWallet } from "../../src/hooks/useWallet";
import { useRouter } from "next/navigation";

// Dynamic import to avoid SSR issues
const ClickAuthContent = dynamic(() => import("../../src/components/ClickAuthContent"), { 
  ssr: false,
  loading: () => <div className="text-center">Loading...</div>
});

export default function ClickAuthPage() {
  const { contractId } = useWallet();
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
        <ClickAuthContent />
      </div>
    </div>
  );
}
