import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { adminConfigured, isAdmin } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Acesso administrativo", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <main className="grid min-h-[100svh] place-items-center bg-night px-6">
      <div className="w-full max-w-sm">
        <p className="font-display text-[2rem] tracking-[0.14em]">MERCANTIL</p>
        <h1 className="mt-8 font-sans text-[1.25rem] font-medium tracking-normal">Painel administrativo</h1>
        {adminConfigured() ? (
          <LoginForm />
        ) : (
          <div className="mt-6 rounded-[3px] border border-[var(--line-dark)] p-5 text-[0.9375rem] text-silver">
            <p className="font-medium text-ivory">Painel desativado.</p>
            <p className="mt-2">
              Defina <code className="text-ivory">ADMIN_PASSWORD</code> e <code className="text-ivory">SESSION_SECRET</code> (32+ caracteres) nas
              variáveis de ambiente da hospedagem para habilitar o acesso.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
