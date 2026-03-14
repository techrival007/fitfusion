import { useState } from "react";
import { Download, Check } from "lucide-react";

export default function ExportButton({ getUrl, filename = "export.csv", label = "Export CSV", className = "" }) {
  const [state, setState] = useState("idle");

  const handleClick = async () => {
    setState("loading");
    try {
      const url   = typeof getUrl === "function" ? getUrl() : getUrl;
      const token = localStorage.getItem("admin_token");
      const res   = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (res.ok) {
        const blob = await res.blob();
        const link = document.createElement("a");
        link.href  = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        setState("done");
        setTimeout(() => setState("idle"), 3000);
      } else {
        setState("idle");
      }
    } catch {
      setState("idle");
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={state === "loading"}
      className={`flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest border transition-all disabled:opacity-50 ${
        state === "done"
          ? "bg-[#22c55e] text-white border-[#22c55e]"
          : "bg-white text-[#111827] border-[#E5E7EB] hover:border-[#111827]"
      } ${className}`}
    >
      {state === "loading" && <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {state === "done"    && <Check size={12} />}
      {state === "idle"    && <Download size={12} />}
      {state === "done" ? "Downloaded" : state === "loading" ? "Exporting..." : label}
    </button>
  );
}
