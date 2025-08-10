<p align="center"><img width="426" height="454" alt="isotype" src="https://github.com/user-attachments/assets/07c44716-b4be-4c0b-be60-6d778579b019" /></p>

# Objetivo / Objective
**ES:** El `Passkey-kit` es una librería desarrollada por Kale-pail de SDF cuyo objetivo es facilitar el onboarding de usuarios a la red de Stellar, eliminando la necesidad de contraseñas y *seed phrases*. El poder de tu wallet reside en tus biométricos.  
**EN:** `Passkey-kit` is a library developed by Kale-pail from SDF, aimed at simplifying user onboarding to the Stellar network, removing the need for passwords and seed phrases. Your wallet’s power resides in your biometrics.

# Funcionamiento / How it Works
![IMG_0019](https://github.com/user-attachments/assets/bb691e0a-654d-405d-8eb4-1862ea70bddd)

# Implementación / Implementation  
## Implementando Passkey Kit en un proyecto Next.js (App Router)  
**ES:** Esta guía explica cómo integrar **Passkey Kit** en un repositorio **Next.js**, siguiendo la misma estructura que el POC de Oppia.  
**EN:** This guide explains how to integrate **Passkey Kit** into a **Next.js** repository, following the same structure as the Oppia POC.

---

## 1) Instalar dependencias / Install dependencies

```bash
npm i passkey-kit passkey-kit-sdk zustand base64url @stellar/stellar-sdk
# Optional UI packages
npm i lucide-react @radix-ui/react-slot clsx class-variance-authority
```

---

## 2) Configurar Next.js / Configure Next.js

**ES:** Añade esto a `next.config.mjs`  
**EN:** Add this to `next.config.mjs`

```js
// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["passkey-kit", "passkey-kit-sdk", "sac-sdk"],
};
export default nextConfig;
```

---

## 3) Variables de entorno / Environment variables

**ES:** Crea `.env` con:  
**EN:** Create `.env` with:

```env
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
NEXT_PUBLIC_WALLET_WASM_HASH=your-wallet-wasm-hash-here

# Launchtube
NEXT_PUBLIC_LAUNCHTUBE_URL=https://launchtube.stellar.org
NEXT_PUBLIC_LAUNCHTUBE_JWT=your-launchtube-jwt-here

# Mercury
NEXT_PUBLIC_MERCURY_PROJECT_NAME=your-project-name
NEXT_PUBLIC_MERCURY_URL=https://mercury.stellar.org
NEXT_PUBLIC_MERCURY_JWT=your-mercury-jwt-here

# Native contract (SAC)
NEXT_PUBLIC_NATIVE_CONTRACT_ID=your-native-contract-id-here
```

---

## 4) Crear `src/lib/passkey.ts` / Create `src/lib/passkey.ts`

```ts
import { PasskeyKit, PasskeyServer, SACClient } from "passkey-kit";
import { Account, Keypair, StrKey } from "@stellar/stellar-sdk/minimal";
import { Buffer } from "buffer";
import { basicNodeSigner } from "@stellar/stellar-sdk/minimal/contract";
import { Server } from "@stellar/stellar-sdk/minimal/rpc";

const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL!;
const networkPassphrase = process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE!;
const walletWasmHash = process.env.NEXT_PUBLIC_WALLET_WASM_HASH!;
const launchtubeUrl = process.env.NEXT_PUBLIC_LAUNCHTUBE_URL!;
const launchtubeJwt = process.env.NEXT_PUBLIC_LAUNCHTUBE_JWT!;
const mercuryProjectName = process.env.NEXT_PUBLIC_MERCURY_PROJECT_NAME!;
const mercuryUrl = process.env.NEXT_PUBLIC_MERCURY_URL!;
const mercuryJwt = process.env.NEXT_PUBLIC_MERCURY_JWT!;
const nativeContractId = process.env.NEXT_PUBLIC_NATIVE_CONTRACT_ID!;

export const rpc = new Server(rpcUrl);

export const mockPubkey = StrKey.encodeEd25519PublicKey(Buffer.alloc(32));
export const mockSource = new Account(mockPubkey, "0");

export const fundKeypairPromise: Promise<Keypair> = (async () => {
  const now = new Date(); now.setMinutes(0,0,0);
  const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(now.getTime().toString()));
  const kp = Keypair.fromRawEd25519Seed(Buffer.from(hashBuffer));
  try { await rpc.getAccount(kp.publicKey()); } catch { try { await rpc.requestAirdrop(kp.publicKey()); } catch {} }
  return kp;
})();
export async function getFundPubkey() { return (await fundKeypairPromise).publicKey(); }
export async function getFundSigner() { return basicNodeSigner(await fundKeypairPromise, networkPassphrase); }

export const account = new PasskeyKit({ rpcUrl, networkPassphrase, walletWasmHash });
export const server  = new PasskeyServer({
  rpcUrl, launchtubeUrl, launchtubeJwt, mercuryProjectName, mercuryUrl, mercuryJwt,
});

export const sac = new SACClient({ rpcUrl, networkPassphrase });
export const native = sac.getSACClient(nativeContractId);
```

---

## 5) Store con Zustand (opcional) / Zustand store (optional)

```ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import base64url from "base64url";

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
        } catch (err: unknown) {
          set({ isLoading: false, error: err instanceof Error ? err.message : "Connection failed" });
          throw err;
        }
      },

      register: async (name: string) => {
        set({ isLoading: true, error: null });
        try {
          const { account, server } = await import("../lib/passkey");
          const { keyId: kid, contractId: cid, signedTx } = await account.createWallet("App", name);
          await server.send(signedTx);
          set({ keyId: base64url(kid), contractId: cid, isLoading: false });
        } catch (err: unknown) {
          set({ isLoading: false, error: err instanceof Error ? err.message : "Registration failed" });
          throw err;
        }
      },

      disconnect: () => set({ keyId: null, contractId: null, error: null }),
    }),
    { name: "wallet-storage", storage: createJSONStorage(() => localStorage), partialize: (s) => ({ keyId: s.keyId, contractId: s.contractId }) }
  )
);
```

---

## 6) Hook de wallet / Wallet hook

```ts
import { useWalletStore } from "@/store/walletStore";

export function useWallet() {
  const { keyId, contractId, isLoading, error, connect, register, disconnect, setLoading, setError } = useWalletStore();
  return { keyId, contractId, isLoading, error, connect, register, disconnect, setLoading, setError };
}
```

---

## 7) Páginas Login y Register / Login & Register pages

```tsx
"use client";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { isLoading, error, connect } = useWallet();
  return (
    <div className="flex items-center justify-center py-12">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-center text-3xl font-bold">Login with Passkey</h2>
        <div className="space-y-4">
          <Button onClick={() => connect()} disabled={isLoading} className="w-full">
            {isLoading ? "Connecting..." : "Connect"}
          </Button>
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
        </div>
      </div>
    </div>
  );
}
```

`app/register/page.tsx`:

```tsx
"use client";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const { isLoading, error, register } = useWallet();
  return (
    <div className="flex items-center justify-center py-12">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-center text-3xl font-bold">Register with Passkey</h2>
        <div className="space-y-4">
          <Button onClick={() => register("My Wallet")} disabled={isLoading} className="w-full">
            {isLoading ? "Creating wallet..." : "Register Wallet"}
          </Button>
          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
        </div>
      </div>
    </div>
  );
}
```

---

## 8) Dashboard

```tsx
"use client";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { keyId, contractId, disconnect } = useWallet();
  return (
    <div className="p-6 space-y-4">
      <div>Connected: {contractId ? "✅ Yes" : "❌ No"}</div>
      {contractId && <div>Contract ID: <code>{contractId}</code></div>}
      {keyId && <div>Key ID: <code>{keyId}</code></div>}
      {contractId && <Button onClick={disconnect} variant="destructive">Disconnect</Button>}
    </div>
  );
}
```
---

## 9) Ejemplo de contrato / Contract example

```tsx
"use client";
import { useEffect, useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { Client, networks } from "click_auth";

export default function ClickAuthPage() {
  const { contractId } = useWallet();
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    if (!client && contractId) {
      setClient(new Client({
        contractId: networks.testnet.contractId,
        networkPassphrase: networks.testnet.networkPassphrase,
        rpcUrl: process.env.NEXT_PUBLIC_RPC_URL!,
      }));
    }
  }, [client, contractId]);

  // Example calls:
  // await client.get();
  // await client.click({ user: contractId! });
}
```
---

## 10) Correr el proyecto / Run the project

```bash
cd demo
npm run dev
# Visit http://localhost:3000
```

---

## 11) Deploy en Vercel / Deploy to Vercel

**ES:** Este proyecto está configurado para deployar automáticamente en Vercel. El archivo `vercel.json` especifica que el proyecto Next.js está en el directorio `demo/`.  
**EN:** This project is configured to deploy automatically on Vercel. The `vercel.json` file specifies that the Next.js project is in the `demo/` directory.

### Opciones de deploy / Deployment options:

1. **Deploy automático desde GitHub / Automatic deploy from GitHub:**
   - Conecta tu repositorio a Vercel
   - Vercel detectará automáticamente la configuración

2. **Deploy manual / Manual deploy:**
   ```bash
   # Instalar Vercel CLI
   npm i -g vercel
   
   # Desde el root del repositorio
   vercel
   ```

3. **Variables de entorno en Vercel / Environment variables in Vercel:**
   - Añade todas las variables de entorno en el dashboard de Vercel
   - Las variables deben empezar con `NEXT_PUBLIC_`

---

**Made by [@villarley](https://github.com/villarley)**
