import React, { useEffect, useState } from "react";
import { api, API_BASE_URL } from "../api";
import { Camera, Calendar, Clock, Eye, X, ShieldAlert } from "lucide-react";

export const ScreenshotsView: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>("");
  const [screenshots, setScreenshots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    api.get("/employees")
      .then((res) => {
        setEmployees(res.data);
        if (res.data.length > 0) {
          setSelectedEmpId(res.data[0].id);
        }
      })
      .catch((err) => console.error("Error fetching employees:", err));
  }, []);

  const fetchScreenshots = () => {
    if (!selectedEmpId) return;
    setLoading(true);
    api.get(`/monitoring/screenshots/employee/${selectedEmpId}`)
      .then((res) => setScreenshots(res.data))
      .catch((err) => console.error("Error fetching screenshots:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchScreenshots();
  }, [selectedEmpId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Camera className="h-5 w-5 text-teal-400" />
            <span>Workstation Screen Monitoring</span>
          </h2>
          <p className="text-xs text-slate-400">
            Authorized periodic captures of company video editing suites with access audit trail.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-400">Employee:</span>
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-teal-500 focus:outline-none"
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.fullName} (@{emp.username})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="flex items-start space-x-3 rounded-xl border border-teal-500/20 bg-teal-500/5 p-4 text-xs text-teal-300">
        <ShieldAlert className="h-5 w-5 shrink-0 text-teal-400 mt-0.5" />
        <div>
          <span className="font-bold">Privacy & Compliance Guarantee:</span> Screenshots are captured only while an employee is actively clocked in on office workstations. Keystrokes and private messaging text are never logged.
        </div>
      </div>

      {/* Screenshot Gallery Grid */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
        {loading ? (
          <div className="text-xs text-slate-500 py-12 text-center">Loading screenshot captures...</div>
        ) : screenshots.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {screenshots.map((s) => (
              <div
                key={s.id}
                onClick={() => setActiveImage(`${API_BASE_URL.replace("/api", "")}${s.storagePath}`)}
                className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-800 bg-slate-950 transition hover:border-teal-500/40"
              >
                <div className="aspect-video w-full bg-slate-900 overflow-hidden flex items-center justify-center">
                  <img
                    src={`${API_BASE_URL.replace("/api", "")}${s.storagePath}`}
                    alt="Workstation Screen"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    onError={(e: any) => {
                      e.target.onerror = null;
                      e.target.src = "https://placehold.co/600x340/0f172a/14b8a6?text=Studio+Screen+Capture";
                    }}
                  />
                </div>

                <div className="p-3 flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center space-x-1.5 font-mono text-[11px]">
                    <Clock className="h-3 w-3 text-slate-500" />
                    <span>{new Date(s.capturedAt).toLocaleTimeString()}</span>
                  </div>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                    {new Date(s.capturedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-xs text-slate-500">
            No screenshots recorded for this employee yet. (Captures occur automatically while clocked in).
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {activeImage && (
        <div
          onClick={() => setActiveImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 cursor-zoom-out"
        >
          <div className="relative max-h-[90vh] max-w-5xl rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 p-2 shadow-2xl">
            <button
              onClick={() => setActiveImage(null)}
              className="absolute right-4 top-4 rounded-full bg-black/60 p-2 text-white hover:bg-black/90"
            >
              <X className="h-5 w-5" />
            </button>
            <img src={activeImage} alt="Expanded Screenshot" className="max-h-[85vh] w-auto object-contain rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
};
