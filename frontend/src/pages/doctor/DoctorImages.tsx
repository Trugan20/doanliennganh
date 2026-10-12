import { useState, useRef, useEffect } from "react";
import DoctorSidebar from "../../components/layout/DoctorSidebar";
import { imageApi, doctorApi } from "../../services/api";
import { useApi } from "../../hooks/useApi";
import { useToastContext } from "../../context/ToastContext";
import ImageViewer from "../../components/ui/ImageViewer";
import type { DentalImage } from "../../types";

interface Patient {
  id: string;
  _id: string;
  name: string;
  email: string;
}

const typeConfig: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  xray: { icon: "🦴", color: "#7c3aed", bg: "bg-violet-50", label: "X-quang" },
  photo: { icon: "📷", color: "#a855f7", bg: "bg-purple-50", label: "Hình ảnh" },
  scan: { icon: "🔬", color: "#c084fc", bg: "bg-fuchsia-50", label: "Quét 3D" },
};

export default function DoctorImages() {
  const { data: images, loading, refetch } = useApi<DentalImage[]>(() => imageApi.getAll());
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<DentalImage | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadType, setUploadType] = useState<"xray" | "photo" | "scan">("photo");
  const [description, setDescription] = useState("");
  const [patientFilter, setPatientFilter] = useState("all");
  const fileRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState("all");
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToastContext();

  const patientIdOf = (i: any): string =>
    typeof i.patient === "object" && i.patient ? String(i.patient._id || i.patient.id || "") : String(i.patient || "");
  const dateOf = (i: any): string | undefined => i.uploadedAt || i.createdAt;

  const filtered = (images || []).filter(
    (i) =>
      (filter === "all" || i.type === filter) &&
      (patientFilter === "all" || patientIdOf(i) === patientFilter),
  );

  // Chỉ lấy những bệnh nhân mà bác sĩ này đã khám
  useEffect(() => {
    const fetchPatients = async () => {
      setLoadingPatients(true);
      try {
        const res = await doctorApi.getExaminedPatients();
        setPatients(res.data?.data || []);
      } catch (err) {
        console.error("Failed to load patients:", err);
        toast.error("Không tải được danh sách bệnh nhân đã khám");
      } finally {
        setLoadingPatients(false);
      }
    };
    fetchPatients();
  }, []);

  const uploadFile = async (file: File) => {
    if (!selectedPatient) {
      toast.error("Vui lòng chọn bệnh nhân trước");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Chỉ hỗ trợ file hình ảnh");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ảnh vượt quá 10MB");
      return;
    }

    setUploading(true);
  const fd = new FormData();
    fd.append("patientId", selectedPatient);
    fd.append("type", uploadType);
    fd.append("description", description);
    fd.append("image", file);

    try {
      await imageApi.upload(fd);
      toast.success("Tải lên thành công!");
      refetch();
      setShowUploadForm(false);
      setSelectedPatient("");
      setDescription("");
      setUploadType("photo");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Tải lên thất bại");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await uploadFile(file);
  };

  const openPreview = (img: DentalImage) => {
    setPreview(img);
    setShowPreview(true);
  };

  return (
    <div className="flex min-h-screen" style={{ background: "linear-gradient(145deg, #faf5ff 0%, #f5f3ff 50%, #ede9fe 100%)" }}>
      <DoctorSidebar />
      <div className="flex-1 lg:ml-0 min-w-0">
        {/* Header */}
        <div className="glass-header sticky top-0 z-10 px-6 lg:px-8 py-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Hình ảnh nha khoa</h1>
            <p className="text-xs text-slate-400 mt-0.5">{filtered.length} hình ảnh</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Filter pills */}
            <div className="flex items-center gap-1.5 bg-white rounded-xl p-1 border border-slate-100 shadow-sm">
              {[
                { id: "all", label: "Tất cả" },
                { id: "xray", label: "🦴 X-quang" },
                { id: "photo", label: "📷 Hình ảnh" },
                { id: "scan", label: "🔬 Quét 3D" },
              ].map((f) => {
                const isActive = filter === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? "text-white shadow-sm"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                    style={isActive ? { background: "linear-gradient(135deg, #7c3aed, #6d28d9)" } : {}}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
            <select
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-100 shadow-sm text-slate-600 focus:outline-none focus:border-violet-400"
              value={patientFilter}
              onChange={(e) => setPatientFilter(e.target.value)}
            >
              <option value="all">Tất cả bệnh nhân</option>
              {patients.map((p) => (
                <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>
              ))}
            </select>
            <button
              onClick={() => setShowUploadForm(true)}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:hover:translate-y-0"
              style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)", boxShadow: "0 4px 14px rgba(109, 40, 217, 0.4)" }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {uploading ? "Đang tải..." : "Tải lên"}
            </button>
          </div>
        </div>

        <div className="space-y-4 p-6 lg:p-8">
          {/* Hidden file input */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />

          {/* Upload Form Card */}
          {showUploadForm && (
            <div className="card card-hover p-6 border border-slate-100 animate-scale-in">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #7c3aed15, #6d28d915)" }}>
                  <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 mb-1">Tải lên hình ảnh mới</h3>
                  <p className="text-sm text-slate-400 mb-4">Chọn bệnh nhân và kéo thả hoặc chọn file để tải lên</p>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Chọn bệnh nhân</label>
                      <select
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition"
                        value={selectedPatient}
                        onChange={(e) => setSelectedPatient(e.target.value)}
                        disabled={loadingPatients}
                        style={{ background: "#fafafa" }}
                      >
                        <option value="">Chọn bệnh nhân...</option>
                        {patients.map((p) => (
                          <option key={p.id || p._id} value={p.id || p._id}>
                            {p.name} - {p.email}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Loại ảnh */}
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Loại ảnh</label>
                      <div className="flex gap-2">
                        {(["photo", "xray", "scan"] as const).map((t) => {
                          const cfg = typeConfig[t];
                          const active = uploadType === t;
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setUploadType(t)}
                              className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border-2"
                              style={{
                                background: active ? `${cfg.color}10` : "transparent",
                                borderColor: active ? cfg.color : "#e2e8f0",
                                color: active ? cfg.color : "#94a3b8",
                              }}
                            >
                              {cfg.icon} {cfg.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Mô tả (không bắt buộc)</label>
                      <input
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition"
                        placeholder="Ví dụ: X-quang hàm trên, răng 36..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>

                    {/* Drag and drop zone */}
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ${
                        isDragging
                          ? "border-violet-400 bg-violet-50"
                          : selectedPatient
                            ? "border-slate-200 hover:border-violet-300 hover:bg-slate-50 cursor-pointer"
                            : "border-slate-200 bg-slate-50"
                      }`}
                      onClick={() => (selectedPatient ? fileRef.current?.click() : toast.error("Vui lòng chọn bệnh nhân trước"))}
                    >
                      {uploading ? (
                        <div className="space-y-3">
                          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed15, #6d28d915)" }}>
                            <div className="w-8 h-8 border-3 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
                          </div>
                          <p className="text-sm font-semibold text-violet-600">Đang tải lên...</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed15, #6d28d915)" }}>
                            <svg className="w-8 h-8 text-violet-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-700">
                              {isDragging ? "Thả file vào đây" : "Kéo thả hình ảnh hoặc click để chọn"}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              Hỗ trợ: JPG, PNG, GIF, WebP (tối đa 10MB)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowUploadForm(false);
                          setSelectedPatient("");
                          setDescription("");
                          setUploadType("photo");
                          if (fileRef.current) fileRef.current.value = "";
                        }}
                        className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-200 transition"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton aspect-square rounded-2xl" />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div className="card text-center py-20 animate-fade-in">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "linear-gradient(135deg, #7c3aed15, #6d28d915)" }}>
                <svg className="w-10 h-10 text-violet-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="font-black text-slate-700 text-lg mb-2">Không có hình ảnh</p>
              <p className="text-sm text-slate-400 max-w-xs mx-auto">
                {filter !== "all" ? "Thử chọn bộ lọc khác" : "Tải lên hình ảnh nha khoa để xem ở đây"}
              </p>
            </div>
          )}

          {/* Image Gallery Grid */}
          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filtered.map((img, idx) => {
                const cfg = typeConfig[img.type] || typeConfig.photo;
                return (
                  <div
                    key={img.id}
                    onClick={() => openPreview(img)}
                    className="group relative aspect-square bg-white rounded-2xl overflow-hidden cursor-pointer border border-slate-100 hover:shadow-xl transition-all duration-300 animate-fade-in hover:-translate-y-1"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    <img
                      src={img.url}
                      alt={img.description || "Dental image"}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />

                    {/* Type badge */}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold backdrop-blur-md"
                        style={{ background: `${cfg.color}20`, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-violet-900/80 via-violet-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4">
                      <p className="text-white text-sm font-bold truncate">{img.patientName}</p>
                      <p className="text-white/70 text-xs mt-1">
                        {dateOf(img) ? new Date(dateOf(img)!).toLocaleDateString("vi-VN") : ""}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-white/90 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-lg">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                          Xem chi tiết
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Xem ảnh: phóng to / thu nhỏ */}
      {showPreview && preview && (
        <ImageViewer
          src={preview.url}
          alt={preview.description ?? "Hình ảnh nha khoa"}
          onClose={() => setShowPreview(false)}
          caption={(() => {
            const cfg = typeConfig[preview.type] || typeConfig.photo;
            const d = dateOf(preview);
            return (
              <div>
                <p className="font-bold">{preview.patientName}</p>
                <p className="text-white/70">
                  {cfg.icon} {cfg.label}{d ? ` · ${new Date(d).toLocaleDateString("vi-VN")}` : ""}
                </p>
                {preview.description && <p className="text-white/70 mt-0.5">{preview.description}</p>}
                <a
                  href={preview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-xs font-semibold text-white/90 underline"
                >
                  Mở ảnh gốc / Tải xuống
                </a>
              </div>
            );
          })()}
        />
      )}
    </div>
  );
}
