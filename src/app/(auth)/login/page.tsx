"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Authentication failed");
      }
      router.push("/events");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 min-h-screen">
      <Card className="w-full max-w-md space-y-6 border border-white/[0.08]">
        <div className="text-center space-y-2.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#DFC094] via-[#C5A880] to-[#8C6D3B] flex items-center justify-center text-[#0A0B0E] font-serif font-black text-lg mx-auto shadow-md shadow-[#C5A880]/20">
            EP
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Access EventPilot Atelier</h2>
          <p className="text-xs text-slate-400">Sign in to coordinate and calibrate your commissions</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-xs text-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Client Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="client@atelier.com"
          />
          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
            Sign In to Atelier
          </Button>
        </form>

        <div className="text-center text-xs text-slate-400">
          First-time commissioner?{" "}
          <Link href="/register" className="text-[#C5A880] hover:text-[#E8D5B5] font-semibold">
            Create an Account
          </Link>
        </div>
      </Card>
    </div>
  );
}
