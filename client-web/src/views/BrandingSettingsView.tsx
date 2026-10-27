import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import { Palette, Film, Check, ShieldAlert, Sparkles, Building2 } from "lucide-react";

export const BrandingSettingsView: React.FC = () => {
  const { branding, updateBranding, isDeveloper } = useAuth();
  const [appName, setAppName] = useState(branding.appName);
  const [logoUrl, setLogoUrl] = useState(branding.logoUrl);
  const [subtitle, setSubtitle] = useState(branding.companySubtitle);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setAppName(branding.appName);
    setLogoUrl(branding.logoUrl);
    setSubtitle(branding.companySubtitle);
  }, [branding]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDeveloper) {
      alert("Only the Developer can change the company branding configuration.");
      return;
    }

    setSaving(true);
    setSuccess(false);

    try {
      await api.put("/settings/branding", {
        appName,
        logoUrl,
        companySubtitle: subtitle
      });
      updateBranding({ appName, logoUrl, companySubtitle: subtitle });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to save branding");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Palette className="h-5 w-5 text-teal-400" />
          <span>Branding & Agency White-Label Configuration</span>
        </h2>
        <p className="text-xs text-slate-400">
          The developer can configure runtime branding, company logo, and application name applied to both Desktop and Web interfaces.
        </p>
      </div>

      {!isDeveloper && (
        <div className="flex items-start space-x-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-300">
          <ShieldAlert className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
          <span>
            You are viewing branding settings as an Administrator in read-only mode. Only the developer account can modify company white-label assets.
          </span>
        </div>
      )}

      {success && (
        <div className="flex items-center space-x-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-400">
          <Check className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>Branding successfully updated across all Web & Desktop client surfaces!</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Form */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white">White-Label Customization Form</h3>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Displayed Application Name
              </label>
              <input
                type="text"
                disabled={!isDeveloper}
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                placeholder="e.g. Frame Production"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-teal-500 focus:outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Company Subtitle / Motto
              </label>
              <input
                type="text"
                disabled={!isDeveloper}
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Video Editing & Production Agency"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-teal-500 focus:outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Logo Asset URL / Path
              </label>
              <input
                type="text"
                disabled={!isDeveloper}
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="/assets/logo.png"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-teal-500 focus:outline-none disabled:opacity-60 font-mono"
              />
            </div>

            {isDeveloper && (
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-500 transition disabled:opacity-50"
                >
                  {saving ? "Deploying Changes..." : "Deploy Branding Update"}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Live Preview Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-xl">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-teal-400">
            <Sparkles className="h-4 w-4" />
            <span>Real-Time Client Preview</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 flex flex-col items-center justify-center text-center space-y-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl overflow-hidden border border-amber-500/40 bg-slate-900 shadow-lg shadow-amber-500/20">
              <img src={logoUrl || "/logo.png"} alt="Preview" className="h-full w-full object-cover" />
            </div>

            <div>
              <h4 className="text-xl font-black text-white">{appName}</h4>
              <p className="text-xs font-medium text-teal-400/90">{subtitle}</p>
            </div>

            <div className="mt-4 flex items-center space-x-2 text-[11px] text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              <span>Client Runtime Synchronized</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
