"use client";
import { useClickAuth } from "../hooks/useClickAuth";
import { Button } from "../../components/ui/button";

export default function ClickAuthContent() {
  const { clickCount, loading, error, handleClick } = useClickAuth();

  return (
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
  );
}
