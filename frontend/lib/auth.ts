export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

export const logout = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
  }
};

export const formatMoney = (amount: number, currency = "THB"): string =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency }).format(amount);

export const formatDate = (dateString: string): string =>
  new Date(dateString).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });

export const accountTypeLabel = (type: "savings" | "checking"): string =>
  type === "savings" ? "ออมทรัพย์" : "กระแสรายวัน";
