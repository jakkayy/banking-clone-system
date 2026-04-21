"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, CardBody, Chip, Spinner } from "@nextui-org/react";
import { api } from "@/lib/api";
import { getToken, formatMoney, accountTypeLabel, formatDate } from "@/lib/auth";
import { Account, Transaction, ApiResponse, PaginatedTransactions } from "@/lib/types";

const txTypeLabel: Record<Transaction["type"], string> = {
  transfer: "Transfer", deposit: "Deposit", withdrawal: "Withdrawal",
};
const txMethodLabel: Record<Transaction["type"], string> = {
  transfer: "Wire Transfer", deposit: "Direct Deposit", withdrawal: "Liquidation",
};

function LocalTime() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" }) + " BKK");
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return <span>{time}</span>;
}

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    Promise.all([api.auth.me(token), api.accounts.list(token)])
      .then(async ([userRes, accRes]) => {
        setUserName((userRes as ApiResponse<{ first_name: string }>).data.first_name);
        const accs = (accRes as ApiResponse<Account[]>).data ?? [];
        setAccounts(accs);
        if (accs.length > 0) {
          const txRes = await api.transactions.history(accs[0].id, token, 1, 5);
          setTransactions((txRes as ApiResponse<PaginatedTransactions>).data.transactions ?? []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const maxBalance = Math.max(...accounts.map((a) => a.balance), 1);

  const txStatusColor = (s: Transaction["status"]) =>
    s === "completed" ? "warning" : s === "pending" ? "default" : "danger";

  return (
      <div className="min-h-screen p-8" style={{ backgroundColor: "#0a0a0a" }}>
        <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-white text-2xl font-light">
            Welcome back, <span className="font-semibold">{userName || "—"}</span>
          </h1>
          <span className="text-sm" style={{ color: "#555" }}>LOCAL TIME · <LocalTime /></span>
        </div>

        <div className="flex gap-6">
          {/* Left */}
          <div className="flex-1 min-w-0">
            {/* Total Balance Card */}
            <div
              className="rounded-2xl p-7 mb-6 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #1a1500 0%, #2e2500 50%, #1a1200 100%)", border: "1px solid #3a3010" }}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-xs tracking-widest uppercase mb-2" style={{ color: "#8a7a40" }}>Total Liquid Assets</p>
                  {loading ? <Spinner size="sm" color="warning" /> : (
                    <p className="text-4xl font-light text-white">{formatMoney(totalBalance)}</p>
                  )}
                </div>
                <Chip size="sm" variant="bordered" classNames={{ base: "border-[#C9A84C44]", content: "text-[#C9A84C] text-xs tracking-widest uppercase font-semibold" }}>
                  Elite Account
                </Chip>
              </div>
              <div className="flex items-center gap-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-8 h-1 rounded-full" style={{ backgroundColor: i === 0 ? "#C9A84C" : "#3a3010" }} />
                ))}
                <span className="ml-auto text-xs" style={{ color: "#5a4a20" }}>{accounts.length} accounts active</span>
              </div>
              <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full opacity-10" style={{ backgroundColor: "#C9A84C" }} />
            </div>

            {/* Accounts */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#555" }}>Private Accounts</p>
              <Button as={Link} href="/accounts" variant="light" size="sm" className="text-xs tracking-widest uppercase" style={{ color: "#C9A84C" }}>
                Manage All
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center gap-2"><Spinner size="sm" color="warning" /><span className="text-sm" style={{ color: "#444" }}>Loading...</span></div>
            ) : accounts.length === 0 ? (
              <Card shadow="none" className="border" style={{ backgroundColor: "#111", borderColor: "#1f1f1f" }}>
                <CardBody className="text-center py-8">
                  <p className="text-sm mb-2" style={{ color: "#555" }}>No accounts yet</p>
                  <Button as={Link} href="/accounts" variant="light" size="sm" style={{ color: "#C9A84C" }}>Open an account →</Button>
                </CardBody>
              </Card>
            ) : (
              <div className="space-y-3">
                {accounts.map((acc) => {
                  const pct = Math.min((acc.balance / maxBalance) * 100, 100);
                  return (
                    <Card
                      key={acc.id} as={Link} href={`/accounts/${acc.id}`} isPressable shadow="none"
                      className="border w-full" style={{ backgroundColor: "#111", borderColor: "#1f1f1f" }}
                    >
                      <CardBody className="flex flex-row items-center justify-between p-5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-white font-medium text-sm">{accountTypeLabel(acc.type)}</p>
                            <Chip size="sm" variant="dot"
                              color={acc.is_active ? "success" : "default"}
                              classNames={{ content: "text-xs", dot: "w-1.5 h-1.5" }}
                            >
                              {acc.is_active ? "Active" : "Inactive"}
                            </Chip>
                          </div>
                          <p className="text-xs mb-3" style={{ color: "#444" }}>#{acc.account_number}</p>
                          <div className="h-0.5 rounded-full w-36" style={{ backgroundColor: "#1f1f1f" }}>
                            <div className="h-0.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: "#C9A84C" }} />
                          </div>
                        </div>
                        <div className="text-right ml-6">
                          <p className="text-lg font-semibold" style={{ color: "#C9A84C" }}>{formatMoney(acc.balance)}</p>
                          <p className="text-xs mt-0.5" style={{ color: "#444" }}>{acc.currency}</p>
                        </div>
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right */}
          <div className="w-72 shrink-0 space-y-3">
            <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: "#555" }}>Quick Actions</p>
            {[
              { href: "/transfer", label: "Transfer", sub: "Global swift & local" },
              { href: "/deposit", label: "Deposit", sub: "Direct wire transfer" },
              { href: "/withdraw", label: "Withdraw", sub: "Asset liquidation" },
            ].map((action) => (
              <Card key={action.href} as={Link} href={action.href} isPressable shadow="none"
                className="border w-full" style={{ backgroundColor: "#111", borderColor: "#1f1f1f" }}
              >
                <CardBody className="flex flex-row items-center justify-between p-4">
                  <div>
                    <p className="text-sm font-medium text-white">{action.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#555" }}>{action.sub}</p>
                  </div>
                  <span className="text-lg" style={{ color: "#C9A84C" }}>→</span>
                </CardBody>
              </Card>
            ))}

            {/* Vault Activity */}
            <div className="pt-1">
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "#555" }}>Vault Activity</p>
            <Card shadow="none" className="border" style={{ backgroundColor: "#111", borderColor: "#1f1f1f" }}>
              <CardBody className="p-0">
                <div>
                {transactions.length === 0 ? (
                  <p className="text-xs text-center py-6" style={{ color: "#444" }}>No recent activity</p>
                ) : (
                  <>
                    {transactions.map((tx, i) => {
                      const isCredit = tx.type === "deposit" || (tx.type === "transfer" && tx.to_account_id === accounts[0]?.id);
                      return (
                        <div key={tx.id} className="px-4 py-3" style={i < transactions.length - 1 ? { borderBottom: "1px solid #1a1a1a" } : {}}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-white">{txTypeLabel[tx.type]}</p>
                              <p className="text-xs mt-0.5" style={{ color: "#444" }}>{txMethodLabel[tx.type]}</p>
                              <p className="text-xs mt-0.5" style={{ color: "#333" }}>{formatDate(tx.created_at)}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs font-semibold" style={{ color: isCredit ? "#4ade80" : "#C9A84C" }}>
                                {isCredit ? "+" : "−"}{formatMoney(tx.amount)}
                              </p>
                              <Chip size="sm" variant="dot" color={txStatusColor(tx.status)}
                                classNames={{ base: "h-4 mt-1", content: "text-xs px-0.5 tracking-widest uppercase", dot: "w-1.5 h-1.5" }}
                              >
                                {tx.status}
                              </Chip>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div className="px-4 py-2.5 border-t" style={{ borderColor: "#1a1a1a" }}>
                      <Button as={Link} href={accounts[0] ? `/accounts/${accounts[0].id}` : "/accounts"}
                        variant="light" size="sm" className="text-xs tracking-widest uppercase p-0 h-auto" style={{ color: "#C9A84C" }}>
                        View All Statements →
                      </Button>
                    </div>
                  </>
                )}
                </div>
              </CardBody>
            </Card>
            </div>
          </div>
        </div>
        </div>
      </div>
  );
}
