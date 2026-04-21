"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, CardBody, Chip, Spinner } from "@nextui-org/react";
import { api } from "@/lib/api";
import { getToken, formatMoney, accountTypeLabel } from "@/lib/auth";
import { Account, ApiResponse } from "@/lib/types";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<"savings" | "checking">("savings");
  const [error, setError] = useState("");

  const fetchAccounts = () => {
    const token = getToken();
    if (!token) return;
    api.accounts
      .list(token)
      .then((res) => setAccounts((res as ApiResponse<Account[]>).data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAccounts(); }, []);

  const handleCreate = async () => {
    setError("");
    setCreating(true);
    try {
      await api.accounts.create({ type }, getToken()!);
      setShowForm(false);
      fetchAccounts();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "สร้างบัญชีไม่สำเร็จ");
    } finally {
      setCreating(false);
    }
  };

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const maxBalance = Math.max(...accounts.map((a) => a.balance), 1);

  return (
      <div className="min-h-screen p-8" style={{ backgroundColor: "#0a0a0a" }}>
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-white text-2xl font-light">Portfolio</h1>
              <p className="text-xs tracking-widest uppercase mt-1" style={{ color: "#555" }}>Private Accounts</p>
            </div>
            <Button
              size="sm"
              onPress={() => setShowForm(!showForm)}
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ backgroundColor: "#C9A84C", color: "#0a0a0a" }}
            >
              + New Account
            </Button>
          </div>

          {/* Summary Row */}
          {!loading && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: "Total Balance", value: formatMoney(totalBalance) },
                { label: "Accounts", value: `${accounts.length} active` },
                { label: "Currency", value: accounts[0]?.currency ?? "THB" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl p-5"
                  style={{ backgroundColor: "#111", border: "1px solid #1f1f1f" }}
                >
                  <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "#555" }}>{stat.label}</p>
                  <p className="text-lg font-semibold" style={{ color: "#C9A84C" }}>{stat.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Create Form */}
          {showForm && (
            <Card shadow="none" className="border mb-6" style={{ backgroundColor: "#111", borderColor: "#1f1f1f" }}>
              <CardBody className="p-5">
                <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "#555" }}>
                  Select Account Type
                </p>
                <div className="flex gap-3 mb-4">
                  {(["savings", "checking"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className="flex-1 py-3 rounded-lg text-sm font-medium transition-colors"
                      style={
                        type === t
                          ? { backgroundColor: "#1a1500", color: "#C9A84C", border: "1px solid #C9A84C44" }
                          : { backgroundColor: "transparent", color: "#555", border: "1px solid #2a2a2a" }
                      }
                    >
                      {accountTypeLabel(t)}
                    </button>
                  ))}
                </div>
                {error && (
                  <div className="text-sm rounded-lg px-4 py-3 mb-3" style={{ backgroundColor: "#1a0a0a", border: "1px solid #3a1010", color: "#f87171" }}>
                    {error}
                  </div>
                )}
                <div className="flex gap-3">
                  <Button
                    isLoading={creating}
                    onPress={handleCreate}
                    className="flex-1 font-semibold"
                    style={{ backgroundColor: "#C9A84C", color: "#0a0a0a" }}
                  >
                    Open Account
                  </Button>
                  <Button variant="light" onPress={() => setShowForm(false)} style={{ color: "#444" }}>
                    Cancel
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Account List */}
          {loading ? (
            <div className="flex items-center gap-3 py-10 justify-center">
              <Spinner size="sm" color="warning" />
              <span className="text-sm" style={{ color: "#444" }}>Loading accounts...</span>
            </div>
          ) : accounts.length === 0 ? (
            <Card shadow="none" className="border" style={{ backgroundColor: "#111", borderColor: "#1f1f1f" }}>
              <CardBody className="text-center py-16">
                <p className="text-sm mb-1" style={{ color: "#555" }}>No accounts yet</p>
                <p className="text-xs mb-4" style={{ color: "#333" }}>เปิดบัญชีแรกของคุณเพื่อเริ่มต้น</p>
                <Button
                  size="sm"
                  onPress={() => setShowForm(true)}
                  className="font-semibold mx-auto"
                  style={{ backgroundColor: "#C9A84C", color: "#0a0a0a" }}
                >
                  Open Account
                </Button>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-3">
              {accounts.map((acc) => {
                const pct = Math.min((acc.balance / maxBalance) * 100, 100);
                return (
                  <Card
                    key={acc.id}
                    as={Link}
                    href={`/accounts/${acc.id}`}
                    isPressable
                    shadow="none"
                    className="border w-full"
                    style={{ backgroundColor: "#111", borderColor: "#1f1f1f" }}
                  >
                    <CardBody className="flex flex-row items-center p-5 gap-6">
                      {/* Account info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <p className="text-white font-medium">{accountTypeLabel(acc.type)}</p>
                          <Chip
                            size="sm"
                            variant="dot"
                            color={acc.is_active ? "success" : "default"}
                            classNames={{ content: "text-xs", dot: "w-1.5 h-1.5" }}
                          >
                            {acc.is_active ? "Active" : "Inactive"}
                          </Chip>
                        </div>
                        <p className="text-xs mb-3" style={{ color: "#444" }}>Account No. {acc.account_number}</p>
                        <div className="h-0.5 rounded-full" style={{ backgroundColor: "#1f1f1f", maxWidth: "200px" }}>
                          <div className="h-0.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: "#C9A84C" }} />
                        </div>
                      </div>
                      {/* Balance */}
                      <div className="text-right shrink-0">
                        <p className="text-xl font-semibold" style={{ color: "#C9A84C" }}>{formatMoney(acc.balance)}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#444" }}>{acc.currency}</p>
                      </div>
                      {/* Arrow */}
                      <span className="text-base shrink-0" style={{ color: "#333" }}>→</span>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
  );
}
