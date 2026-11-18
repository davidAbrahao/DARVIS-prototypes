"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { useAuth } from "./auth-provider";

export function SessionActions() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut() {
    setBusy(true);
    setError(null);
    try {
      await signOut();
      router.replace("/login");
    } catch {
      setError("Não foi possível encerrar a sessão no servidor.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="session-actions">
      {user ? <span className="session-identity">{user.full_name}</span> : null}
      <button
        className="icon-button session-logout"
        type="button"
        onClick={() => void handleSignOut()}
        disabled={busy}
        aria-label="Encerrar sessão"
        title="Encerrar sessão"
      >
        <LogOut size={17} />
      </button>
      {error ? <span className="session-error" role="alert">{error}</span> : null}
    </div>
  );
}
