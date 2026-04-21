"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, CardBody, Chip, Spinner } from "@nextui-org/react";
import { api } from "@/lib/api";
import { getToken, formatMoney, formatDate, accountTypeLabel } from "@/lib/auth";
import { Account, Transaction, PaginatedTransactions, ApiResponse } from "@/lib/types";

const txTypeLabel: Record<Transaction["type"], string> = {
  transfer: "Wire Transfer",
  deposit: "Deposit",
  withdrawal: "Withdrawal",
};

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 10;

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    Promise.all([
      api.accounts.get(id, token),
      api.transactions.history(id, token, page, limit),
    ])
      .then(([accRes, txRes]) => {
        setAccount((accRes as ApiResponse<Account>).data);
        const d = (txRes as ApiResponse<PaginatedTransactions>).data;
        setTransactions(d.transactions ?? []);
        setTotal(d.total);
      })
      .catch(() => router.push("/accounts"))
      .finally(() => setLoading(false));
  }, [id, page, router]);

  const totalPages = Math.ceil(total / limit);

  const getTxStyle = (tx: Transaction) => {
    const isCredit = tx.type === "deposit" || (tx.type === "transfer" && tx.to_account_id === id);
    return { sign: isCredit ? "+" : "−", color: isCredit ? "#4ade80" : "#C9A84C" };
  };

  const txStatusColor = (s: Transaction["status"]) =>
    s === "completed" ? "warning" : s === "pending" ? "default" : "danger";

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center" style={{ backgroundColor: "#0a0a0a" }}>
        <div className="flex items-center gap-3">
          <Spinner size="sm" color="warning" />
          <span className="text-sm" style={{ color: "#444" }}>Loading account...</span>
        </div>
      </div>
    );
  }

  if (!account) return null;

  return (
      <div className="min-h-screen p-8" style={{ backgroundColor: "#0a0a0a" }}>
        <div className="max-w-4xl mx-auto">

          {/* Account Header Card */}
          <div
            className="rounded-2xl p-7 mb-6 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #1a1500 0%, #2e2500 50%, #1a1200 100%)",
              border: "1px solid #3a3010",
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs tracking-widest uppercase mb-1" style={{ color: "#8a7a40" }}>
                  {accountTypeLabel(account.type)}
                </p>
                <p className="text-xs" style={{ color: "#5a4a20" }}>Account No. {account.account_number}</p>
              </div>
              <Chip
                size="sm"
                variant="bordered"
                color={account.is_active ? "success" : "default"}
                classNames={{ content: "text-xs tracking-widest uppercase font-semibold" }}
              >
                {account.is_active ? "Active" : "Inactive"}
              </Chip>
            </div>
            <p className="text-4xl font-light text-white mb-6">{formatMoney(account.balance)}</p>

            {/* Quick Actions */}
            <div className="flex gap-3">
              {[
                { href: `/transfer`, label: "Transfer" },
                { href: `/deposit`, label: "Deposit" },
                { href: `/withdraw`, label: "Withdraw" },
              ].map((a) => (
                <Button
                  key={a.href}
                  as={Link}
                  href={a.href}
                  size="sm"
                  variant="bordered"
                  className="text-xs tracking-widest uppercase font-semibold"
                  style={{ borderColor: "#3a3010", color: "#C9A84C" }}
                >
                  {a.label}
                </Button>
              ))}
            </div>

            <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full opacity-10" style={{ backgroundColor: "#C9A84C" }} />
          </div>

          {/* Transactions Section */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#555" }}>
              Vault Activity
            </p>
            <p className="text-xs" style={{ color: "#333" }}>{total} transactions</p>
          </div>

          {transactions.length === 0 ? (
            <Card shadow="none" className="border" style={{ backgroundColor: "#111", borderColor: "#1f1f1f" }}>
              <CardBody className="text-center py-16">
                <p className="text-sm" style={{ color: "#444" }}>No transactions yet</p>
              </CardBody>
            </Card>
          ) : (
            <Card shadow="none" className="border" style={{ backgroundColor: "#111", borderColor: "#1f1f1f" }}>
              <CardBody className="p-0">
                {/* Table header */}
                <div className="grid grid-cols-4 px-5 py-3 border-b" style={{ borderColor: "#1f1f1f" }}>
                  {["Transaction", "Type", "Amount", "Status"].map((h) => (
                    <p key={h} className="text-xs tracking-widest uppercase" style={{ color: "#333" }}>{h}</p>
                  ))}
                </div>

                {transactions.map((tx, i) => {
                  const { sign, color } = getTxStyle(tx);
                  return (
                    <div
                      key={tx.id}
                      className="grid grid-cols-4 px-5 py-4 items-center"
                      style={i < transactions.length - 1 ? { borderBottom: "1px solid #1a1a1a" } : {}}
                    >
                      <div>
                        <p className="text-sm text-white font-medium">{txTypeLabel[tx.type]}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#444" }}>{formatDate(tx.created_at)}</p>
                        {tx.description && (
                          <p className="text-xs mt-0.5 truncate max-w-[120px]" style={{ color: "#333" }}>{tx.description}</p>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: "#555" }}>{txTypeLabel[tx.type]}</p>
                      <p className="text-sm font-semibold" style={{ color }}>
                        {sign}{formatMoney(tx.amount)}
                      </p>
                      <Chip
                        size="sm"
                        variant="dot"
                        color={txStatusColor(tx.status)}
                        classNames={{ base: "h-4", content: "text-xs px-0.5 tracking-widest uppercase", dot: "w-1.5 h-1.5" }}
                      >
                        {tx.status}
                      </Chip>
                    </div>
                  );
                })}
              </CardBody>
            </Card>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-5">
              <Button
                variant="light"
                size="sm"
                isDisabled={page === 1}
                onPress={() => setPage((p) => p - 1)}
                className="text-xs tracking-widest uppercase"
                style={{ color: "#C9A84C" }}
              >
                ← Previous
              </Button>
              <span className="text-xs" style={{ color: "#444" }}>Page {page} of {totalPages}</span>
              <Button
                variant="light"
                size="sm"
                isDisabled={page === totalPages}
                onPress={() => setPage((p) => p + 1)}
                className="text-xs tracking-widest uppercase"
                style={{ color: "#C9A84C" }}
              >
                Next →
              </Button>
            </div>
          )}
        </div>
      </div>
  );
}
