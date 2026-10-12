import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

interface Props {
  src: string;
  alt?: string;
  onClose: () => void;
  /** Thông tin hiển thị phía dưới ảnh (loại ảnh, ngày, mô tả...) */
  caption?: ReactNode;
}

const MIN_SCALE = 1;
const MAX_SCALE = 6;
const STEP = 0.25;

/**
 * Xem ảnh toàn màn hình: phóng to / thu nhỏ (nút, cuộn chuột, phím + - 0),
 * kéo để di chuyển khi đã phóng to, nhấp đúp để phóng to nhanh, Esc để đóng.
 */
export default function ImageViewer({ src, alt = "Hình ảnh", onClose, caption }: Props) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

  const clamp = (v: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, v));
  const zoomIn = useCallback(() => setScale((s) => clamp(s + STEP)), []);
  const zoomOut = useCallback(() => setScale((s) => clamp(s - STEP)), []);
  const reset = useCallback(() => { setScale(1); setPos({ x: 0, y: 0 }); }, []);

  // Về vị trí giữa khi thu nhỏ về 100%
  useEffect(() => {
    if (scale === 1) setPos({ x: 0, y: 0 });
  }, [scale]);

  // Khoá cuộn trang phía sau
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Phím tắt
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "+" || e.key === "=") zoomIn();
      else if (e.key === "-") zoomOut();
      else if (e.key === "0") reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, zoomIn, zoomOut, reset]);

  // Cuộn chuột để zoom (cần listener không-passive để chặn cuộn trang)
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setScale((s) => clamp(s + (e.deltaY < 0 ? STEP : -STEP)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (scale <= 1) return;
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d) return;
    setPos({ x: d.ox + (e.clientX - d.sx), y: d.oy + (e.clientY - d.sy) });
  };
  const onPointerUp = () => {
    dragRef.current = null;
    setDragging(false);
  };

  const btn =
    "w-10 h-10 rounded-xl bg-white/15 text-white flex items-center justify-center hover:bg-white/30 transition disabled:opacity-40 disabled:hover:bg-white/15";

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col animate-fade-in"
      style={{ background: "rgba(0,0,0,0.92)" }}
      role="dialog"
      aria-modal="true"
    >
      {/* Thanh công cụ */}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <button className={btn} onClick={zoomOut} disabled={scale <= MIN_SCALE} title="Thu nhỏ (-)">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" d="M5 12h14" /></svg>
          </button>
          <span className="text-white text-sm font-semibold w-14 text-center select-none">
            {Math.round(scale * 100)}%
          </span>
          <button className={btn} onClick={zoomIn} disabled={scale >= MAX_SCALE} title="Phóng to (+)">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" d="M12 5v14M5 12h14" /></svg>
          </button>
          <button className={`${btn} w-auto px-3 text-xs font-bold`} onClick={reset} title="Về kích thước gốc (0)">
            Đặt lại
          </button>
        </div>
        <button className={btn} onClick={onClose} title="Đóng (Esc)">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* Vùng ảnh */}
      <div
        ref={stageRef}
        className="flex-1 min-h-0 flex items-center justify-center overflow-hidden select-none touch-none"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={() => (scale > 1 ? reset() : setScale(2.5))}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="max-w-full max-h-full object-contain"
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            transition: dragging ? "none" : "transform 0.15s ease-out",
            cursor: scale > 1 ? (dragging ? "grabbing" : "grab") : "zoom-in",
          }}
        />
      </div>

      {/* Thông tin ảnh */}
      {caption && (
        <div className="px-4 py-3 text-center text-white/90 text-sm">{caption}</div>
      )}
    </div>
  );
}
