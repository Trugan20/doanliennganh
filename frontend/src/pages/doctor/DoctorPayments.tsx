import { useState, useEffect } from "react";
import DoctorSidebar from "../../components/layout/DoctorSidebar";
import { paymentApi } from "../../services/api";

interface Payment {
  _id: string;
  invoiceNumber: string;
  patientName: string;
  amount: number;
  method: string;
  status: string;
  paidAt: string;
  description: string;
  createdAt: string;
}

const methodLabels: Record<string, string> = {
  cash: "Tiền mặt",
  bank_transfer: "Chuyển khoản",
  momo: "MoMo",
  vnpay: "VNPay",
  zalo_pay: "ZaloPay",
  insurance: "Bảo hiểm",
  other: "Khác",
};

const methodColors: Record<string, string> = {
  cash: "#10b981",
  bank_transfer: "#0ea5e9",
  momo: "#ec4899",
  vnpay: "#6366f1",
  zalo_pay: "#06b6d4",
  insurance: "#f59e0b",
  other: "#8b5cf6",
};

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: "Chờ thanh toán", bg: "bg-amber-50", text: "text-amber-700" },
  paid: { label: "Đã thanh toán", bg: "bg-emerald-50", text: "text-emerald-700" },
  failed: { label: "Thất bại", bg: "bg-red-50", text: "text-red-700" },
  refunded: { label: "Đã hoàn tiền", bg: "bg-blue-50", text: "text-blue-700" },
  cancelled: { label: "Đã hủy", bg: "bg-slate-100", text: "text-slate-600" },
};

export default function DoctorPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await paymentApi.getAll();
      const data = res.data?.data?.data || res.data?.data || [];
      setPayments(Array.isArray(data) ? data : []);
    } catch {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = payments.filter((p) => {
    const matchSearch =
      !search ||
      p.patientName?.toLowerCase().includes(search.toLowerCase()) ||
      p.invoiceNumber?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalRevenue = filtered
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div className="flex min-h-screen" style={{ background: "linear-gradient(145deg, #f5f3ff 0%, #ede9fe 40%, #f0f9ff 100%)" }}>
      <DoctorSidebar />
      <div className="flex-1 lg:ml-0 min-w-0">
        <div className="glass-header sticky top-0 z-10 px-6 lg:px-8 py-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Thanh toán</h1>
            <p className="text-xs text-slate-400 mt-0.5">{payments.length} phiếu thanh toán</p>
          </div>
        </div>

        <div className="p-6 lg:p-8 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Tổng phiếu", value: payments.length, color: "#7c3aed" },
              { label: "Đã thanh toán", value: payments.filter((p) => p.status === "paid").length, color: "#10b981" },
              { label: "Chờ thanh toán", value: payments.filter((p) => p.status === "pending").length, color: "#f59e0b" },
              { label: "Doanh thu", value: totalRevenue.toLocaleString("vi-VN") + " đ", color: "#0ea5e9" },
            ].map((s) => (
              <div key={s.label} className="card p-4 text-center border border-slate-100">
                <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs font-semibold text-slate-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="card card-hover p-3 flex-1 border border-slate-100 flex items-center gap-3">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none"
                placeholder="Tìm theo tên hoặc mã hóa đơn..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch("")} className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 flex items-center justify-center">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {["all", "paid", "pending"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterStatus === s ? "text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"}`}
                  style={filterStatus === s ? { background: "linear-gradient(135deg, #7c3aed, #6d28d9)" } : {}}
                >
                  {s === "all" ? "Tất cả" : statusConfig[s]?.label || s}
                </button>
              ))}
            </div>
          </div>

          {!loading && filtered.length === 0 && (
            <div className="card text-center py-16">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "linear-gradient(135deg, #7c3aed15, #6d28d915)" }}>
                <svg className="w-8 h-8 text-violet-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <p className="font-black text-slate-700 text-lg mb-2">Chưa có phiếu thanh toán</p>
              <p className="text-sm text-slate-400">Danh sách thanh toán sẽ hiển thị tại đây</p>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="card overflow-hidden border border-slate-100">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {['Mã hóa đơn', 'Bệnh nhân', 'Số tiền', 'Phương thức', 'Trạng thái', 'Ngày thanh toán'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p, i) => {
                      const cfg = statusConfig[p.status] || statusConfig.pending;
                      return (
                        <tr key={p._id || i} className="border-b border-slate-50 hover:bg-slate-50 transition">
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs font-bold text-violet-600 bg-violet-50 px-2 py-1 rounded-lg">
                              {p.invoiceNumber}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-800">{p.patientName}</p>
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-800">
                            {p.amount.toLocaleString("vi-VN")} đ
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={{ background: `${methodColors[p.method]}15`, color: methodColors[p.method] }}
                            >
                              {methodLabels[p.method] || p.method}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text}`}>
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            {p.paidAt ? new Date(p.paidAt).toLocaleDateString("vi-VN") : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {loading && (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl skeleton" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
