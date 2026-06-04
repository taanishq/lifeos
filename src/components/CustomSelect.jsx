import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

export default function CustomSelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
    setOpen(o => !o);
  };

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        onClick={handleOpen}
        className="input flex items-center justify-between w-full text-left"
      >
        <span className="text-white">{value}</span>
        <ChevronDown size={15} className={`text-slate-400 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && createPortal(
        <div
          style={{ position: "absolute", top: coords.top, left: coords.left, width: coords.width, zIndex: 9999 }}
          className="bg-[#1e2130] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
        >
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); onChange(opt); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-indigo-600/30 hover:text-white
                ${value === opt ? "bg-indigo-600/20 text-indigo-300" : "text-slate-300"}`}
            >
              {opt}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}