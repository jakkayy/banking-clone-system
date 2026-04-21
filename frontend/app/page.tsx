"use client";

import { Button } from "@nextui-org/react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#0a0a0a" }}>
      <nav className="flex items-center justify-between px-10 py-5 border-b" style={{ borderColor: "#1f1f1f" }}>
        <span className="text-white text-sm font-bold tracking-widest uppercase">
          JAK<span style={{ color: "#C9A84C" }}>Bank</span>
        </span>
        <div className="flex items-center gap-3">
          <Button as={Link} href="/login" variant="light" className="text-[#555] hover:text-white" size="sm">
            Sign In
          </Button>
          <Button as={Link} href="/register" size="sm" className="font-semibold" style={{ backgroundColor: "#C9A84C", color: "#0a0a0a" }}>
            Open Account
          </Button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-2xl">
          <div
            className="inline-flex items-center gap-2 text-xs px-4 py-1.5 rounded-full mb-8 tracking-widest uppercase"
            style={{ backgroundColor: "#1a1500", color: "#C9A84C", border: "1px solid #3a3010" }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#C9A84C" }} />
            Private Digital Banking
          </div>

          <h1 className="text-5xl font-light text-white leading-tight mb-6">
            Your wealth,
            <br />
            <span style={{ color: "#C9A84C" }}>managed privately.</span>
          </h1>

          <p className="text-lg leading-relaxed mb-10 max-w-md mx-auto" style={{ color: "#555" }}>
            ระบบธนาคารดิจิทัลที่ปลอดภัย รวดเร็ว และออกแบบมาสำหรับคุณ
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button as={Link} href="/register" size="lg" className="font-semibold px-8" style={{ backgroundColor: "#C9A84C", color: "#0a0a0a" }}>
              เปิดบัญชีใหม่
            </Button>
            <Button as={Link} href="/login" size="lg" variant="bordered" className="font-semibold px-8 border-[#2a2a2a] text-[#888]">
              เข้าสู่ระบบ
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-20 max-w-3xl w-full">
          {[
            { title: "Secure", desc: "ข้อมูลเข้ารหัสทุกการทำรายการ", label: "256-bit encryption" },
            { title: "Instant", desc: "โอนเงินได้ทันทีตลอด 24 ชั่วโมง", label: "Real-time processing" },
            { title: "Private", desc: "ความเป็นส่วนตัวระดับ Private Client", label: "Bank-grade security" },
          ].map((f) => (
            <div key={f.title} className="rounded-xl p-5 text-left" style={{ backgroundColor: "#111", border: "1px solid #1f1f1f" }}>
              <p className="text-xs tracking-widest uppercase mb-3" style={{ color: "#C9A84C" }}>{f.label}</p>
              <p className="text-white font-semibold mb-1">{f.title}</p>
              <p className="text-sm" style={{ color: "#555" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center py-6 text-xs tracking-widest uppercase" style={{ color: "#333" }}>
        © 2026 JAKBank · Private Digital Banking
      </footer>
    </div>
  );
}
