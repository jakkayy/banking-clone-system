"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Spinner, Avatar } from "@nextui-org/react";
import { getToken, logout } from "@/lib/auth";
import { api } from "@/lib/api";
import { User, ApiResponse } from "@/lib/types";

const navItems = [
  { href: "/dashboard", label: "Vault", sub: "Overview", icon: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg> },
  { href: "/accounts", label: "Portfolio", sub: "บัญชีของฉัน", icon: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg> },
  { href: "/transfer", label: "Transfer", sub: "โอนเงิน", icon: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg> },
  { href: "/deposit", label: "Deposit", sub: "ฝากเงิน", icon: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" /></svg> },
  { href: "/withdraw", label: "Withdraw", sub: "ถอนเงิน", icon: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" /></svg> },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    api.auth.me(token)
      .then((res) => setUser((res as ApiResponse<User>).data))
      .catch(() => { logout(); router.push("/login"); })
      .finally(() => setUserLoading(false));
  }, [router]);

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#0a0a0a" }}>
      <aside className="w-56 flex flex-col shrink-0 border-r" style={{ backgroundColor: "#0f0f0f", borderColor: "#1f1f1f" }}>
        {/* Logo */}
        <div className="px-6 py-7 border-b" style={{ borderColor: "#1f1f1f" }}>
          <p className="text-white text-sm font-bold tracking-widest uppercase">
            JAK<span style={{ color: "#C9A84C" }}>Bank</span>
          </p>
        </div>

        {/* User */}
        <div className="px-5 py-5 border-b" style={{ borderColor: "#1f1f1f" }}>
          {userLoading ? (
            <Spinner size="sm" color="warning" />
          ) : (
            <div className="flex items-center gap-3">
              <Avatar
                name={user?.first_name}
                size="sm"
                classNames={{ base: "shrink-0", name: "text-xs font-bold" }}
                style={{ backgroundColor: "#1e1a0e", color: "#C9A84C", border: "1px solid #3a3010" }}
              />
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs tracking-widest uppercase truncate" style={{ color: "#555" }}>
                  Private Client
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium"
                style={isActive
                  ? { backgroundColor: "#1e1a0e", color: "#C9A84C" }
                  : { color: "#555" }
                }
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-5 space-y-2 border-t pt-4" style={{ borderColor: "#1f1f1f" }}>
          <Button
            fullWidth
            variant="bordered"
            size="sm"
            className="text-xs tracking-widest uppercase font-semibold"
            style={{ borderColor: "#3a3010", color: "#C9A84C" }}
          >
            Speak to Advisor
          </Button>
          <Button
            fullWidth
            variant="light"
            size="sm"
            className="text-[#444] hover:text-white justify-start"
            onPress={() => { logout(); router.push("/login"); }}
            startContent={
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
            }
          >
            Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
