"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, Input } from "@nextui-org/react";
import { api } from "@/lib/api";
import { ApiResponse } from "@/lib/types";

const inputClass = {
  label: "text-xs font-medium tracking-widest uppercase !text-[#555]",
  inputWrapper: "bg-[#0a0a0a] !border-[#2a2a2a] hover:!border-[#555] group-data-[focus=true]:!border-[#C9A84C]",
  input: "!text-white placeholder:!text-[#333]",
};

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.auth.login(form);
      localStorage.setItem("token", (res as ApiResponse<{ token: string }>).data.token);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: "#0a0a0a" }}>
      <Link href="/" className="text-sm font-bold tracking-widest uppercase mb-10 text-white">
        JAK<span style={{ color: "#C9A84C" }}>Bank</span>
      </Link>

      <Card shadow="none" className="w-full max-w-sm rounded-2xl border" style={{ backgroundColor: "#111", borderColor: "#1f1f1f" }}>
        <CardBody className="p-8">
          <h1 className="text-white text-lg font-semibold mb-1">Sign In</h1>
          <p className="text-sm mb-6" style={{ color: "#555" }}>เข้าสู่ระบบบัญชีของคุณ</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              labelPlacement="outside"
              type="email"
              required
              variant="bordered"
              placeholder="example@email.com"
              value={form.email}
              onValueChange={(v) => setForm((f) => ({ ...f, email: v }))}
              classNames={inputClass}
            />
            <Input
              label="Password"
              labelPlacement="outside"
              type="password"
              required
              variant="bordered"
              placeholder="รหัสผ่าน"
              value={form.password}
              onValueChange={(v) => setForm((f) => ({ ...f, password: v }))}
              classNames={inputClass}
            />

            {error && (
              <div className="text-sm rounded-lg px-4 py-3" style={{ backgroundColor: "#1a0a0a", border: "1px solid #3a1010", color: "#f87171" }}>
                {error}
              </div>
            )}

            <Button
              type="submit"
              isLoading={loading}
              fullWidth
              className="font-semibold mt-2"
              style={{ backgroundColor: "#C9A84C", color: "#0a0a0a" }}
            >
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: "#444" }}>
            ยังไม่มีบัญชี?{" "}
            <Link href="/register" className="font-medium" style={{ color: "#C9A84C" }}>Open Account</Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
