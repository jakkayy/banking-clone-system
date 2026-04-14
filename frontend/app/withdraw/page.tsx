"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, Input, Select, SelectItem } from "@nextui-org/react";
import AppLayout from "@/components/AppLayout";
import { api } from "@/lib/api";
import { getToken, accountTypeLabel, formatMoney } from "@/lib/auth";
import { Account, ApiResponse } from "@/lib/types";

const inputClass = {
  label: "text-xs font-medium tracking-widest uppercase !text-[#555]",
  inputWrapper: "bg-[#0a0a0a] !border-[#2a2a2a] hover:!border-[#555] group-data-[focus=true]:!border-[#C9A84C]",
  input: "!text-white placeholder:!text-[#333]",
};

export default function WithdrawPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [form, setForm] = useState({ account_id: "", amount: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    api.accounts.list(token).then((res) => {
      const list = (res as ApiResponse<Account[]>).data ?? [];
      setAccounts(list);
      if (list.length > 0) setForm((f) => ({ ...f, account_id: list[0].id }));
    });
  }, []);

  const selectedAccount = accounts.find((a) => a.id === form.account_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      await api.transactions.withdraw({ ...form, amount: parseFloat(form.amount) }, getToken()!);
      setSuccess("Withdrawal completed successfully");
      setForm((f) => ({ ...f, amount: "", description: "" }));
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Withdrawal failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen p-8" style={{ backgroundColor: "#0a0a0a" }}>
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-white text-2xl font-light">Withdraw</h1>
            <p className="text-xs tracking-widest uppercase mt-1" style={{ color: "#555" }}>Asset Liquidation</p>
          </div>

          <div className="flex gap-6 items-start">
            {/* Form */}
            <Card shadow="none" className="border flex-1 min-w-0" style={{ backgroundColor: "#111", borderColor: "#1f1f1f" }}>
              <CardBody className="p-8">
                <form onSubmit={handleSubmit} className="space-y-7">
                  <Select
                    label="From Account"
                    labelPlacement="outside"
                    variant="bordered"
                    selectedKeys={form.account_id ? new Set([form.account_id]) : new Set()}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] as string;
                      if (val) setForm((f) => ({ ...f, account_id: val }));
                    }}
                    classNames={{
                      label: "text-xs font-medium tracking-widest uppercase !text-[#555]",
                      trigger: "bg-[#0a0a0a] !border-[#2a2a2a] hover:!border-[#555] data-[focus=true]:!border-[#C9A84C]",
                      value: "!text-white",
                      popoverContent: "bg-[#111] border border-[#2a2a2a]",
                    }}
                  >
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} textValue={`${accountTypeLabel(acc.type)} — ${acc.account_number}`}
                        classNames={{ base: "text-white data-[hover=true]:bg-[#1a1a1a]" }}>
                        {accountTypeLabel(acc.type)} — {acc.account_number}
                      </SelectItem>
                    ))}
                  </Select>

                  <Input
                    label="Amount (THB)"
                    labelPlacement="outside"
                    type="number"
                    variant="bordered"
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    required
                    value={form.amount}
                    onValueChange={(v) => setForm((f) => ({ ...f, amount: v }))}
                    classNames={inputClass}
                  />
                  <Input
                    label="Note (Optional)"
                    labelPlacement="outside"
                    variant="bordered"
                    placeholder="e.g. Daily expenses"
                    value={form.description}
                    onValueChange={(v) => setForm((f) => ({ ...f, description: v }))}
                    classNames={inputClass}
                  />

                  {error && (
                    <div className="text-sm rounded-lg px-4 py-3" style={{ backgroundColor: "#1a0a0a", border: "1px solid #3a1010", color: "#f87171" }}>
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="text-sm rounded-lg px-4 py-3" style={{ backgroundColor: "#0a1a0a", border: "1px solid #1a3a1a", color: "#4ade80" }}>
                      {success}
                    </div>
                  )}

                  <Button
                    type="submit"
                    isLoading={loading}
                    isDisabled={accounts.length === 0}
                    fullWidth
                    className="font-semibold"
                    style={{ backgroundColor: "#C9A84C", color: "#0a0a0a" }}
                  >
                    Confirm Withdrawal
                  </Button>
                </form>
              </CardBody>
            </Card>

            {/* Sidebar */}
            <div className="w-64 shrink-0 space-y-4">
              {/* Available balance */}
              <div
                className="rounded-xl p-5"
                style={{ background: "linear-gradient(135deg, #1a1500 0%, #2a2000 100%)", border: "1px solid #3a3010" }}
              >
                <p className="text-xs tracking-widest uppercase mb-3" style={{ color: "#8a7a40" }}>Available Balance</p>
                <p className="text-2xl font-light text-white mb-1">
                  {selectedAccount ? formatMoney(selectedAccount.balance) : "—"}
                </p>
                <p className="text-xs" style={{ color: "#5a4a20" }}>
                  {selectedAccount?.account_number ?? "Select an account"}
                </p>
              </div>

              {/* Info card */}
              <Card shadow="none" className="border" style={{ backgroundColor: "#111", borderColor: "#1f1f1f" }}>
                <CardBody className="p-4 space-y-3">
                  <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#555" }}>Withdrawal Info</p>
                  {[
                    { label: "Method", value: "Liquidation" },
                    { label: "Processing", value: "Instant" },
                    { label: "Fee", value: "No charge" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "#444" }}>{item.label}</span>
                      <span className="text-xs font-medium" style={{ color: "#C9A84C" }}>{item.value}</span>
                    </div>
                  ))}
                </CardBody>
              </Card>

              <p className="text-xs text-center px-2" style={{ color: "#333" }}>
                Ensure sufficient balance before confirming
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
