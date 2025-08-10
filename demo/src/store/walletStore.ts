import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import base64url from "base64url";
import { toast } from "sonner";

export interface WalletState {
  keyId: string | null;
  contractId: string | null;
  isLoading: boolean;
  error: string | null;
}
export interface WalletActions {
  setKeyId: (keyId: string) => void;
  setContractId: (contractId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  connect: (keyId?: string) => Promise<void>;
  register: (name: string) => Promise<void>;
  disconnect: () => void;
}
export type WalletStore = WalletState & WalletActions;

export const useWalletStore = create<WalletStore>()(
  persist(
    (set) => ({
      keyId: null,
      contractId: null,
      isLoading: false,
      error: null,

      setKeyId: (keyId) => set({ keyId }),
      setContractId: (contractId) => set({ contractId }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      connect: async (keyId?: string) => {
        set({ isLoading: true, error: null });
        try {
          const { account, server } = await import("../lib/passkey");
          const { keyId: kid, contractId: cid } = await account.connectWallet({
            keyId,
            getContractId: (keyId) => server.getContractId({ keyId }),
          });
          set({ keyId: base64url(kid), contractId: cid, isLoading: false });
          toast.success("Wallet connected successfully!");
        } catch (err: unknown) {
          set({
            isLoading: false,
            error: err instanceof Error ? err.message : "Connection failed",
          });
          toast.error("Connection failed");
          throw err;
        }
      },

      register: async (name: string) => {
        set({ isLoading: true, error: null });
        try {
          const { account, server } = await import("../lib/passkey");
          const {
            keyId: kid,
            contractId: cid,
            signedTx,
          } = await account.createWallet("App", name);
          await server.send(signedTx);
          set({ keyId: base64url(kid), contractId: cid, isLoading: false });
          toast.success("Wallet registered successfully!");
        } catch (err: unknown) {
          set({
            isLoading: false,
            error: err instanceof Error ? err.message : "Registration failed",
          });
          toast.error("Registration failed");
          throw err;
        }
      },

      disconnect: () => set({ keyId: null, contractId: null, error: null }),
    }),
    {
      name: "wallet-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ keyId: s.keyId, contractId: s.contractId }),
    }
  )
);
