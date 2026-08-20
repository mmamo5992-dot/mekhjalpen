"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Wrench, ScanLine, ClipboardList, BookOpen, ArrowLeftRight, Search, Upload,
  Camera, FileText, CheckCircle2, AlertTriangle, ShieldCheck, Gauge, Calendar,
  User, ChevronRight, X, Plus, Fingerprint, BadgeCheck, Car, Fuel, Loader2,
  ArrowRight, Info, Zap, Building2, LogOut, Mail, KeyRound, Download,
  History, Printer, TrendingUp,
} from "lucide-react";
import { supabase, RECEIPTS_BUCKET } from "../lib/supabaseClient";
import { lookupDtc } from "../lib/dtc";

/* ------------------------------------------------------------------ */
/* CONSTANTS + PRIMITIVES                                              */
/* ------------------------------------------------------------------ */

const FUEL_TYPES = ["Bensin (Petrol)", "Diesel", "Hybrid", "El (Electric)"];
const BODY_TYPES = ["Sedan", "Kombi / Estate", "SUV", "Halvkombi / Hatchback", "SkÃ¥pbil / Van", "CoupÃ©"];

const SEVERITY_STYLES = {
  low: { text: "text-[#34A871]", bg: "bg-[#34A871]/10", ring: "ring-[#34A871]/30", label: "Low severity" },
  medium: { text: "text-[#FFB020]", bg: "bg-[#FFB020]/10", ring: "ring-[#FFB020]/30", label: "Medium severity" },
  high: { text: "text-[#E5484D]", bg: "bg-[#E5484D]/10", ring: "ring-[#E5484D]/30", label: "High severity" },
};

const mono = "font-['IBM_Plex_Mono']";

function Eyebrow({ children, icon: Icon }) {
  return (
    <div className={`flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase text-[#8791A0] ${mono}`}>
      {Icon && <Icon size={12} strokeWidth={2.25} />}
      {children}
    </div>
  );
}

function FieldLabel({ children }) {
  return <label className="block text-[12px] font-medium text-[#8791A0] mb-1.5">{children}</label>;
}

function TextInput({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`w-full bg-[#161B22] border border-[#2E3742] rounded-lg px-3 py-2.5 text-[14px] text-[#EDEFF2] placeholder:text-[#5B6472] outline-none focus:border-[#FFB020] focus:ring-1 focus:ring-[#FFB020]/40 transition-colors ${className}`}
    />
  );
}

function Select({ children, ...props }) {
  return (
    <select
      {...props}
      className="w-full bg-[#161B22] border border-[#2E3742] rounded-lg px-3 py-2.5 text-[14px] text-[#EDEFF2] outline-none focus:border-[#FFB020] focus:ring-1 focus:ring-[#FFB020]/40 transition-colors appearance-none bg-no-repeat bg-[right_10px_center]"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238791A0' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
      }}
    >
      {children}
    </select>
  );
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className="w-full bg-[#161B22] border border-[#2E3742] rounded-lg px-3 py-2.5 text-[14px] text-[#EDEFF2] placeholder:text-[#5B6472] outline-none focus:border-[#FFB020] focus:ring-1 focus:ring-[#FFB020]/40 transition-colors resize-none"
    />
  );
}

function PrimaryButton({ children, icon: Icon, className = "", spinning, ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 bg-[#FFB020] hover:bg-[#FFC454] disabled:opacity-40 disabled:cursor-not-allowed text-[#14181C] font-semibold text-[14px] px-4 py-2.5 rounded-lg transition-colors ${className}`}
    >
      {Icon && <Icon size={16} strokeWidth={2.5} className={spinning ? "animate-spin" : ""} />}
      {children}
    </button>
  );
}

function GhostButton({ children, icon: Icon, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 border border-[#2E3742] hover:border-[#4C8DFF]/60 hover:text-[#4C8DFF] text-[#8791A0] text-[13px] font-medium px-3.5 py-2 rounded-lg transition-colors ${className}`}
    >
      {Icon && <Icon size={14} strokeWidth={2.25} />}
      {children}
    </button>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  const tones = {
    verified: { bg: "bg-[#34A871]", icon: BadgeCheck },
    transfer: { bg: "bg-[#4C8DFF]", icon: ArrowLeftRight },
    error: { bg: "bg-[#E5484D]", icon: AlertTriangle },
  };
  const tone = tones[toast.tone] || tones.verified;
  const Icon = tone.icon;
  return (
    <div className="fixed top-5 right-5 z-50 animate-[slideIn_0.25s_ease-out]">
      <div className={`${tone.bg} text-[#0E1116] font-semibold text-[13px] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 max-w-sm`}>
        <Icon size={17} strokeWidth={2.5} className="shrink-0" />
        {toast.message}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* AUTH SCREEN                                                         */
/* ------------------------------------------------------------------ */

function AuthScreen({ notify }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("customer");
  const [shopName, setShopName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim(), role, shop_name: role === "mechanic" ? shopName.trim() : null } },
        });
        if (error) throw error;
        if (!data.session) notify("Account created â check your email to confirm, then sign in.", "verified");
      }
    } catch (err) {
      notify(err.message || "Could not sign you in.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#10141A] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#FFB020]/12 border border-[#FFB020]/30 flex items-center justify-center">
            <Wrench size={19} className="text-[#FFB020]" strokeWidth={2.25} />
          </div>
          <div>
            <div className={`text-[18px] font-bold tracking-tight ${mono} text-[#EDEFF2]`}>MekHjÃ¤lpen</div>
            <div className="text-[10.5px] text-[#5B6472] tracking-[0.14em] uppercase -mt-0.5">Diagnostics Â· Digital Passport</div>
          </div>
        </div>

        <form onSubmit={submit} className="bg-[#1B2129] border border-[#2E3742] rounded-2xl p-5">
          <div className="flex gap-1.5 mb-5 bg-[#161B22] border border-[#2E3742] rounded-full p-1">
            {[["signin", "Sign in"], ["signup", "Create account"]].map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setMode(k)}
                className={`flex-1 py-1.5 rounded-full text-[12.5px] font-medium transition-colors ${
                  mode === k ? "bg-[#FFB020] text-[#14181C]" : "text-[#8791A0] hover:text-[#EDEFF2]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === "signup" && (
            <>
              <div className="mb-3">
                <FieldLabel>Full name</FieldLabel>
                <TextInput value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" required />
              </div>
              <div className="mb-3">
                <FieldLabel>I am aâ¦</FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                  {[["customer", "Car owner", BookOpen], ["mechanic", "Mechanic", Wrench]].map(([k, label, Icon]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setRole(k)}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-[13px] font-medium transition-colors ${
                        role === k
                          ? "border-[#FFB020]/60 bg-[#FFB020]/10 text-[#FFB020]"
                          : "border-[#2E3742] text-[#8791A0] hover:text-[#EDEFF2]"
                      }`}
                    >
                      <Icon size={14} /> {label}
                    </button>
                  ))}
                </div>
              </div>
              {role === "mechanic" && (
                <div className="mb-3">
                  <FieldLabel>Workshop name</FieldLabel>
                  <TextInput value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="Mekta Verkstad Â· Uppsala" />
                </div>
              )}
            </>
          )}

          <div className="mb-3">
            <FieldLabel>Email</FieldLabel>
            <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.se" required />
          </div>
          <div className="mb-4">
            <FieldLabel>Password</FieldLabel>
            <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" required minLength={6} />
          </div>

          <PrimaryButton type="submit" className="w-full" icon={busy ? Loader2 : KeyRound} spinning={busy} disabled={busy}>
            {busy ? "Workingâ¦" : mode === "signin" ? "Sign in" : "Create account"}
          </PrimaryButton>
        </form>

        <p className="text-[11.5px] text-[#5B6472] mt-4 text-center leading-relaxed">
          Your role is set when you create the account and decides what you can do. Mechanics write service stamps; owners read them.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* DIAGNOSTIC WORKSPACE                                                */
/* ------------------------------------------------------------------ */

function DiagnosticWorkspace({ profile, notify }) {
  const [form, setForm] = useState({ code: "", year: "", make: "", model: "", fuelType: FUEL_TYPES[0], bodyType: BODY_TYPES[0] });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const runDiagnostic = async () => {
    const code = form.code.trim().toUpperCase();
    if (!code) { notify("Enter a DTC code to run a diagnostic.", "error"); return; }
    setLoading(true);
    setResult(null);

    const raw = lookupDtc(code);

    // Map dtc.js shape → component shape
    const analysis = raw ? {
      code: raw.code,
      name: raw.description || raw.name || raw.code,
      severity: raw.severity || "medium",
      causes: (raw.causes || (raw.possibleCauses || []).map(c => ({ label: c, prob: "" }))),
      tests: raw.tests || [],
      fixes: raw.fixes || raw.commonFixes || [],
      unmapped: raw.unmapped || false,
    } : null;

    // Persist the lookup so the workshop builds its own history of faults seen.
    const { error } = await supabase.from("diagnostic_logs").insert({
      mechanic_id: profile.id,
      dtc_code: code,
      year: form.year ? Number(form.year) : null,
      make: form.make || null,
      model: form.model || null,
      fuel_type: form.fuelType,
      body_type: form.bodyType,
      result: analysis,
    });
    if (error) console.warn("Diagnostic log insert failed:", error.message);

    if (!analysis) { notify("Could not parse diagnostic result.", "error"); setLoading(false); return; }
    setResult({ ...analysis, ctx: { ...form, code } });
    setLoading(false);
  };

  const sev = result ? SEVERITY_STYLES[result.severity] : null;

  return (
    <div className="grid lg:grid-cols-[380px_1fr] gap-5">
      <div className="bg-[#1B2129] border border-[#2E3742] rounded-2xl p-5">
        <Eyebrow icon={ScanLine}>Fault Input</Eyebrow>
        <h2 className={`text-[19px] font-semibold text-[#EDEFF2] mt-1 mb-4 ${mono}`}>Diagnostic Workspace</h2>

        <div className="space-y-4">
          <div>
            <FieldLabel>DTC Code</FieldLabel>
            <TextInput placeholder="e.g. P0420" value={form.code} onChange={set("code")} maxLength={6} className={`${mono} tracking-wider uppercase`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><FieldLabel>Year</FieldLabel><TextInput type="number" placeholder="2018" value={form.year} onChange={set("year")} /></div>
            <div><FieldLabel>Make</FieldLabel><TextInput placeholder="Volvo" value={form.make} onChange={set("make")} /></div>
          </div>
          <div><FieldLabel>Model</FieldLabel><TextInput placeholder="V70" value={form.model} onChange={set("model")} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Fuel Type</FieldLabel>
              <Select value={form.fuelType} onChange={set("fuelType")}>{FUEL_TYPES.map((f) => <option key={f}>{f}</option>)}</Select>
            </div>
            <div>
              <FieldLabel>Body Type</FieldLabel>
              <Select value={form.bodyType} onChange={set("bodyType")}>{BODY_TYPES.map((b) => <option key={b}>{b}</option>)}</Select>
            </div>
          </div>
          <PrimaryButton className="w-full mt-2" icon={loading ? Loader2 : Zap} spinning={loading} onClick={runDiagnostic} disabled={loading}>
            {loading ? "Scanningâ¦" : "Run Diagnostic"}
          </PrimaryButton>
        </div>
      </div>

      <div className="bg-[#10141A] border border-[#2E3742] rounded-2xl p-5 min-h-[420px] relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-5">
            <div className="relative w-full h-20 overflow-hidden rounded-lg border border-[#2E3742] bg-[#0B0E12]">
              <div className="absolute inset-x-0 h-8 bg-gradient-to-b from-transparent via-[#FFB020]/25 to-transparent animate-[scan_1.15s_linear_infinite]" />
              <div className={`absolute inset-0 flex items-center justify-center ${mono} text-[#FFB020] text-[12px] tracking-[0.2em]`}>
                READING FAULT MEMORYâ¦
              </div>
            </div>
            <p className={`text-[#5B6472] text-[12px] ${mono}`}>cross-referencing knowledge base</p>
          </div>
        )}

        {!loading && !result && (
          <div className="h-full flex flex-col items-center justify-center text-center py-16 gap-3">
            <ScanLine size={30} className="text-[#2E3742]" strokeWidth={1.5} />
            <p className="text-[#5B6472] text-[13px] max-w-[240px]">Enter a fault code and vehicle context, then run a diagnostic to see structured fix guidance here.</p>
          </div>
        )}

        {!loading && result && (
          <div className="animate-[fadeIn_0.3s_ease-out]">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className={`${mono} text-[#FFB020] text-[22px] font-bold tracking-wide`}>{result.code}</div>
                <div className="text-[#EDEFF2] text-[15px] font-medium mt-0.5">{result.name}</div>
              </div>
              <span className={`shrink-0 ${sev.bg} ${sev.text} ring-1 ${sev.ring} text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide`}>
                {sev.label}
              </span>
            </div>

            {result.ctx.make && (
              <div className={`mt-2 text-[12px] text-[#5B6472] ${mono}`}>
                {[result.ctx.year, result.ctx.make, result.ctx.model].filter(Boolean).join(" ")} Â· {result.ctx.fuelType} Â· {result.ctx.bodyType}
              </div>
            )}

            {result.unmapped && (
              <div className="mt-3 flex items-start gap-2 bg-[#FFB020]/10 border border-[#FFB020]/30 text-[#FFB020] text-[12px] rounded-lg px-3 py-2">
                <Info size={14} className="shrink-0 mt-0.5" />
                Not in the local knowledge base â showing a structured template based on the code&apos;s fault domain.
              </div>
            )}

            <div className="mt-5 grid md:grid-cols-2 gap-5">
              <div>
                <Eyebrow icon={AlertTriangle}>Likely Root Causes</Eyebrow>
                <ul className="mt-2 space-y-2">
                  {result.causes.map((c, i) => (
                    <li key={i} className="flex items-start justify-between gap-2 bg-[#1B2129] border border-[#2E3742] rounded-lg px-3 py-2">
                      <span className="text-[13px] text-[#D5D9E0]">{c.label}</span>
                      <span className={`shrink-0 text-[10px] ${mono} uppercase text-[#8791A0] mt-0.5`}>{c.prob}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <Eyebrow icon={CheckCircle2}>Testing &amp; Verification</Eyebrow>
                <ul className="mt-2 space-y-2">
                  {result.tests.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 bg-[#1B2129] border border-[#2E3742] rounded-lg px-3 py-2 text-[13px] text-[#D5D9E0]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#4C8DFF] mt-1.5 shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-5">
              <Eyebrow icon={Wrench}>Recommended Fix Procedure</Eyebrow>
              <ol className="mt-2 space-y-2">
                {result.fixes.map((f, i) => (
                  <li key={i} className="flex items-start gap-3 bg-[#1B2129] border border-[#2E3742] rounded-lg px-3 py-2.5">
                    <span className={`shrink-0 w-5 h-5 rounded-full bg-[#FFB020]/15 text-[#FFB020] text-[11px] font-bold ${mono} flex items-center justify-center mt-0.5`}>{i + 1}</span>
                    <span className="text-[13px] text-[#D5D9E0] leading-relaxed">{f}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SERVICE LOGGER                                                      */
/* ------------------------------------------------------------------ */

function ServiceLogger({ profile, notify }) {
  const [vin, setVin] = useState("");
  const [lookedUp, setLookedUp] = useState(null); // 'found' | 'new'
  const [vehicle, setVehicle] = useState(null);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ make: "", model: "", year: "", fuelType: FUEL_TYPES[0], bodyType: BODY_TYPES[0], ownerEmail: "" });
  const [mileage, setMileage] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [workDone, setWorkDone] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState([]); // File objects
  const fileInputRef = useRef(null);

  const handleLookup = async () => {
    const clean = vin.trim().toUpperCase();
    if (clean.length < 6) { notify("Enter a valid VIN to look up.", "error"); return; }
    setVin(clean);
    setSearching(true);
    const { data, error } = await supabase.from("vehicles").select("*").eq("vin", clean).maybeSingle();
    setSearching(false);
    if (error) { notify(error.message, "error"); return; }
    if (data) { setVehicle(data); setLookedUp("found"); setMileage(String(data.mileage || "")); }
    else { setVehicle(null); setLookedUp("new"); }
  };

  const resetForm = () => {
    setVin(""); setLookedUp(null); setVehicle(null); setMileage(""); setWorkDone(""); setNotes(""); setFiles([]);
    setNewVehicle({ make: "", model: "", year: "", fuelType: FUEL_TYPES[0], bodyType: BODY_TYPES[0], ownerEmail: "" });
  };

  const submit = async () => {
    if (!lookedUp) { notify("Look up a VIN first.", "error"); return; }
    if (!mileage || !workDone.trim()) { notify("Mileage and work done are required.", "error"); return; }

    setSaving(true);
    try {
      // 1. Register the vehicle if it's new
      if (lookedUp === "new") {
        if (!newVehicle.make || !newVehicle.model || !newVehicle.ownerEmail) {
          throw new Error("Fill in make, model and owner email to register this vehicle.");
        }
        const { data: owner } = await supabase
          .from("profiles").select("id")
          .ilike("email", newVehicle.ownerEmail.trim())
          .maybeSingle();

        const { error: vErr } = await supabase.from("vehicles").insert({
          vin,
          make: newVehicle.make.trim(),
          model: newVehicle.model.trim(),
          year: Number(newVehicle.year) || new Date().getFullYear(),
          fuel_type: newVehicle.fuelType,
          body_type: newVehicle.bodyType,
          mileage: Number(mileage),
          owner_id: owner?.id ?? null,
          pending_owner_email: owner ? null : newVehicle.ownerEmail.trim().toLowerCase(),
        });
        if (vErr) throw vErr;
      }

      // 2. Upload receipts/photos to <VIN>/<timestamp>-<name>
      const uploaded = [];
      for (const file of files) {
        const path = `${vin}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
        const { error: upErr } = await supabase.storage.from(RECEIPTS_BUCKET).upload(path, file, { cacheControl: "3600", upsert: false });
        if (upErr) throw upErr;
        uploaded.push({ name: file.name, path });
      }

      // 3. Write the verified stamp
      const { error: rErr } = await supabase.from("service_records").insert({
        vin,
        mechanic_id: profile.id,
        mechanic_name: profile.full_name,
        shop_name: profile.shop_name,
        service_date: date,
        mileage: Number(mileage),
        work_done: workDone.trim(),
        notes: notes.trim() || null,
        files: uploaded,
        verified: true,
      });
      if (rErr) throw rErr;

      // 4. Keep the vehicle's current mileage in sync
      await supabase.from("vehicles").update({ mileage: Number(mileage), updated_at: new Date().toISOString() }).eq("vin", vin);

      notify(`Service logged & stamped for ${vin}.`, "verified");
      resetForm();
    } catch (err) {
      notify(err.message || "Could not save the service record.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-5">
      <div className="bg-[#1B2129] border border-[#2E3742] rounded-2xl p-5">
        <Eyebrow icon={ClipboardList}>Service Entry</Eyebrow>
        <h2 className={`text-[19px] font-semibold text-[#EDEFF2] mt-1 mb-4 ${mono}`}>Service Logger</h2>

        <div>
          <FieldLabel>VIN</FieldLabel>
          <div className="flex gap-2">
            <TextInput
              placeholder="17-character VIN"
              value={vin}
              onChange={(e) => { setVin(e.target.value); setLookedUp(null); }}
              className={`${mono} tracking-wide uppercase`}
            />
            <GhostButton icon={searching ? Loader2 : Search} onClick={handleLookup} className="shrink-0 px-4">Look up</GhostButton>
          </div>
        </div>

        {lookedUp === "found" && vehicle && (
          <div className="mt-3 flex items-center gap-3 bg-[#161B22] border border-[#2E3742] rounded-lg px-3 py-2.5">
            <Car size={18} className="text-[#4C8DFF] shrink-0" />
            <div className="text-[13px] text-[#D5D9E0]">
              <span className="font-medium text-[#EDEFF2]">{vehicle.year} {vehicle.make} {vehicle.model}</span>
              {" Â· "}{vehicle.fuel_type} Â· current {Number(vehicle.mileage).toLocaleString()} km
            </div>
          </div>
        )}

        {lookedUp === "new" && (
          <div className="mt-3 bg-[#161B22] border border-dashed border-[#4C8DFF]/40 rounded-lg p-3.5">
            <div className="flex items-center gap-2 text-[#4C8DFF] text-[12px] font-medium mb-3">
              <Plus size={14} /> New vehicle â register it to log this service
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><FieldLabel>Make</FieldLabel><TextInput value={newVehicle.make} onChange={(e) => setNewVehicle((v) => ({ ...v, make: e.target.value }))} placeholder="Toyota" /></div>
              <div><FieldLabel>Model</FieldLabel><TextInput value={newVehicle.model} onChange={(e) => setNewVehicle((v) => ({ ...v, model: e.target.value }))} placeholder="Corolla" /></div>
              <div><FieldLabel>Year</FieldLabel><TextInput type="number" value={newVehicle.year} onChange={(e) => setNewVehicle((v) => ({ ...v, year: e.target.value }))} placeholder="2019" /></div>
              <div>
                <FieldLabel>Fuel Type</FieldLabel>
                <Select value={newVehicle.fuelType} onChange={(e) => setNewVehicle((v) => ({ ...v, fuelType: e.target.value }))}>{FUEL_TYPES.map((f) => <option key={f}>{f}</option>)}</Select>
              </div>
              <div>
                <FieldLabel>Body Type</FieldLabel>
                <Select value={newVehicle.bodyType} onChange={(e) => setNewVehicle((v) => ({ ...v, bodyType: e.target.value }))}>{BODY_TYPES.map((b) => <option key={b}>{b}</option>)}</Select>
              </div>
              <div>
                <FieldLabel>Owner Email</FieldLabel>
                <TextInput type="email" value={newVehicle.ownerEmail} onChange={(e) => setNewVehicle((v) => ({ ...v, ownerEmail: e.target.value }))} placeholder="owner@example.se" />
              </div>
            </div>
            <p className="text-[11px] text-[#5B6472] mt-2.5">
              If the owner has no account yet, the car is linked to their email and appears in their garage the moment they sign up.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div><FieldLabel>Mileage (km)</FieldLabel><TextInput type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="e.g. 142300" /></div>
          <div><FieldLabel>Service Date</FieldLabel><TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        </div>

        <div className="mt-3">
          <FieldLabel>Work Done</FieldLabel>
          <TextArea rows={2} value={workDone} onChange={(e) => setWorkDone(e.target.value)} placeholder="e.g. Oil & filter change, brake fluid flush" />
        </div>

        <div className="mt-3">
          <FieldLabel>Mechanic Notes</FieldLabel>
          <TextArea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Torque specs, parts used, observations for next serviceâ¦" />
        </div>

        <div className="mt-3">
          <FieldLabel>Receipts / Photos</FieldLabel>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer border border-dashed border-[#2E3742] hover:border-[#FFB020]/50 rounded-lg px-3 py-4 flex items-center justify-center gap-2 text-[#5B6472] hover:text-[#FFB020] transition-colors"
          >
            <Upload size={16} /> <span className="text-[13px]">Click to attach files</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,application/pdf"
            capture="environment"
            className="hidden"
            onChange={(e) => setFiles((prev) => [...prev, ...Array.from(e.target.files || [])])}
          />
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {files.map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 bg-[#161B22] border border-[#2E3742] rounded-full pl-2.5 pr-1.5 py-1 text-[11px] text-[#8791A0]">
                  {f.type.startsWith("image/") ? <Camera size={12} /> : <FileText size={12} />}
                  {f.name}
                  <button onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))} className="hover:text-[#E5484D]"><X size={12} /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        <PrimaryButton className="w-full mt-5" icon={saving ? Loader2 : BadgeCheck} spinning={saving} onClick={submit} disabled={saving}>
          {saving ? "Savingâ¦" : "Log Service & Stamp"}
        </PrimaryButton>
      </div>

      <div className="bg-[#10141A] border border-[#2E3742] rounded-2xl p-5 h-fit">
        <Eyebrow icon={ShieldCheck}>How Verification Works</Eyebrow>
        <div className="mt-3 space-y-3 text-[13px] text-[#8791A0] leading-relaxed">
          <p>Every entry is signed with your mechanic identity and permanently attached to the vehicle&apos;s VIN. Owners can read it; nobody can edit or delete it â not even you.</p>
          <p>Records follow the car for life, even across a sale. Ownership can change; the service history never resets.</p>
        </div>
        <div className="mt-4 flex items-center gap-2 text-[12px] text-[#34A871] bg-[#34A871]/10 border border-[#34A871]/25 rounded-lg px-3 py-2">
          <Fingerprint size={14} /> Signed by {profile.full_name}{profile.shop_name ? ` Â· ${profile.shop_name}` : ""}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* MECHANIC DASHBOARD â RECENT STAMPS                                  */
/* ------------------------------------------------------------------ */

function StatTile({ label, value, sub, icon: Icon }) {
  return (
    <div className="bg-[#1B2129] border border-[#2E3742] rounded-xl px-4 py-3.5">
      <div className="flex items-center gap-1.5 text-[10.5px] tracking-[0.14em] uppercase text-[#5B6472]">
        <Icon size={11} /> {label}
      </div>
      <div className={`${mono} text-[24px] font-bold text-[#EDEFF2] mt-1.5 leading-none`}>{value}</div>
      {sub && <div className="text-[11px] text-[#5B6472] mt-1.5">{sub}</div>}
    </div>
  );
}

function RecentStamps({ profile, notify }) {
  const [stamps, setStamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("service_records")
      .select("*, vehicles(make, model, year)")
      .eq("mechanic_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(100);
    setLoading(false);
    if (error) { notify(error.message, "error"); return; }
    setStamps(data || []);
  }, [profile.id, notify]);

  useEffect(() => { load(); }, [load]);

  const thisMonth = (() => {
    const now = new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return stamps.filter((s) => String(s.service_date).startsWith(prefix)).length;
  })();
  const uniqueVins = new Set(stamps.map((s) => s.vin)).size;

  const q = query.trim().toLowerCase();
  const filtered = q
    ? stamps.filter((s) =>
        s.vin.toLowerCase().includes(q) ||
        s.work_done.toLowerCase().includes(q) ||
        `${s.vehicles?.make || ""} ${s.vehicles?.model || ""}`.toLowerCase().includes(q))
    : stamps;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Stamps this month" value={thisMonth} icon={TrendingUp} sub="Signed by you" />
        <StatTile label="Total stamps" value={stamps.length} icon={BadgeCheck} sub="Last 100 shown" />
        <StatTile label="Vehicles serviced" value={uniqueVins} icon={Car} sub="Unique VINs" />
        <StatTile
          label="Last stamp"
          value={stamps[0] ? String(stamps[0].service_date).slice(5) : "â"}
          icon={Calendar}
          sub={stamps[0] ? `${stamps[0].vehicles?.make || ""} ${stamps[0].vehicles?.model || ""}`.trim() || stamps[0].vin : "No entries yet"}
        />
      </div>

      <div className="bg-[#10141A] border border-[#2E3742] rounded-2xl p-5">
        <div className="flex items-end justify-between gap-3 flex-wrap mb-4">
          <div>
            <Eyebrow icon={History}>Workshop Feed</Eyebrow>
            <h2 className={`text-[19px] font-semibold text-[#EDEFF2] mt-1 ${mono}`}>Recent Stamps</h2>
          </div>
          <div className="flex items-center gap-2">
            <TextInput
              placeholder="Filter by VIN, car or workâ¦"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-[220px] text-[13px] py-2"
            />
            <GhostButton icon={loading ? Loader2 : Search} onClick={load} className="shrink-0">Refresh</GhostButton>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-12"><Loader2 size={20} className="animate-spin text-[#5B6472]" /></div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-14 flex flex-col items-center gap-3">
            <ClipboardList size={28} className="text-[#2E3742]" strokeWidth={1.5} />
            <p className="text-[#5B6472] text-[13px] max-w-[260px]">
              {stamps.length === 0
                ? "No stamps yet. Log your first service and it will show up here."
                : "Nothing matches that filter."}
            </p>
          </div>
        )}

        <div className="space-y-2.5">
          {!loading && filtered.map((s) => (
            <div key={s.id} className="border border-[#2E3742] bg-[#161B22] rounded-xl px-4 py-3.5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <BadgeCheck size={15} className="text-[#34A871] shrink-0" />
                  <span className="text-[13.5px] font-medium text-[#EDEFF2] truncate">{s.work_done}</span>
                </div>
                <span className={`text-[11px] ${mono} text-[#8791A0] flex items-center gap-1 shrink-0`}>
                  <Calendar size={11} /> {s.service_date}
                </span>
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#8791A0]">
                <span className="flex items-center gap-1">
                  <Car size={11} />
                  {s.vehicles ? `${s.vehicles.year} ${s.vehicles.make} ${s.vehicles.model}` : "Vehicle"}
                </span>
                <span className={`${mono} text-[11px] tracking-wide text-[#5B6472]`}>{s.vin}</span>
                <span className="flex items-center gap-1"><Gauge size={11} /> {Number(s.mileage).toLocaleString()} km</span>
              </div>

              {s.notes && <p className="mt-2 text-[12.5px] text-[#B3BAC5] leading-relaxed line-clamp-2">{s.notes}</p>}

              {s.files?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {s.files.map((f, i) => <FileChip key={i} file={f} notify={notify} />)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* TIMELINE                                                            */
/* ------------------------------------------------------------------ */

function FileChip({ file, notify }) {
  const [busy, setBusy] = useState(false);
  const open = async () => {
    if (!file.path) return;
    setBusy(true);
    const { data, error } = await supabase.storage.from(RECEIPTS_BUCKET).createSignedUrl(file.path, 60);
    setBusy(false);
    if (error) { notify?.("That file isn't available to your account.", "error"); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };
  return (
    <button
      onClick={open}
      className="inline-flex items-center gap-1.5 bg-[#0E1116] border border-[#2E3742] hover:border-[#4C8DFF]/50 rounded-full px-2.5 py-1 text-[10.5px] text-[#8791A0] hover:text-[#4C8DFF] transition-colors"
    >
      {busy ? <Loader2 size={11} className="animate-spin" /> : file.name?.match(/\.(jpg|jpeg|png|heic|webp)$/i) ? <Camera size={11} /> : <FileText size={11} />}
      {file.name}
      <Download size={10} />
    </button>
  );
}

function PassportTimeline({ entries, notify }) {
  if (!entries.length) {
    return <div className="text-[13px] text-[#5B6472] text-center py-8">No entries yet â this vehicle&apos;s passport is empty.</div>;
  }
  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className={`border rounded-xl px-4 py-3.5 ${
            entry.kind === "transfer" ? "border-[#4C8DFF]/30 bg-[#4C8DFF]/[0.06]" : "border-[#2E3742] bg-[#161B22]"
          }`}
        >
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              {entry.kind === "transfer"
                ? <ArrowLeftRight size={15} className="text-[#4C8DFF]" />
                : <BadgeCheck size={15} className="text-[#34A871]" />}
              <span className="text-[13.5px] font-medium text-[#EDEFF2]">{entry.title}</span>
            </div>
            <span className={`text-[11px] ${mono} text-[#8791A0] flex items-center gap-1`}>
              <Calendar size={11} /> {entry.date}
            </span>
          </div>

          {entry.kind === "service" && (
            <>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#8791A0]">
                <span className="flex items-center gap-1"><Gauge size={11} /> {Number(entry.mileage).toLocaleString()} km</span>
                <span className="flex items-center gap-1">
                  <Wrench size={11} /> {entry.mechanic_name}{entry.shop_name ? ` Â· ${entry.shop_name}` : ""}
                </span>
              </div>
              {entry.notes && <p className="mt-2 text-[12.5px] text-[#B3BAC5] leading-relaxed">{entry.notes}</p>}
              {entry.files?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {entry.files.map((f, i) => <FileChip key={i} file={f} notify={notify} />)}
                </div>
              )}
            </>
          )}

          {entry.kind === "transfer" && entry.subtitle && (
            <p className="mt-1.5 text-[12.5px] text-[#8FB3FF]">{entry.subtitle}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// Merge service records + transfers into one date-sorted timeline
function buildTimeline(records = [], transfers = []) {
  const a = records.map((r) => ({
    id: r.id, kind: "service", date: r.service_date, title: r.work_done,
    mileage: r.mileage, notes: r.notes, mechanic_name: r.mechanic_name,
    shop_name: r.shop_name, files: r.files || [], sort: r.service_date,
  }));
  const b = transfers.map((t) => ({
    id: t.id, kind: "transfer", date: String(t.transferred_at).slice(0, 10),
    title: "Ownership transferred",
    subtitle: t.from_owner_name
      ? `${t.from_owner_name} â ${t.to_owner_name || t.to_owner_email}. Full service history carried forward permanently.`
      : "Full service history carried forward permanently.",
    sort: String(t.transferred_at).slice(0, 10),
  }));
  return [...a, ...b].sort((x, y) => (x.sort < y.sort ? 1 : -1));
}

function VehicleCard({ vehicle, onOpen, selected }) {
  return (
    <button
      onClick={onOpen}
      className={`text-left w-full bg-[#1B2129] border rounded-xl p-4 transition-colors ${
        selected ? "border-[#FFB020]/60 ring-1 ring-[#FFB020]/30" : "border-[#2E3742] hover:border-[#4C8DFF]/50"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#EDEFF2] font-medium text-[14.5px]">
          <Car size={16} className="text-[#4C8DFF]" /> {vehicle.year} {vehicle.make} {vehicle.model}
        </div>
        <ChevronRight size={16} className="text-[#5B6472]" />
      </div>
      <div className="mt-2 flex items-center gap-3 text-[11.5px] text-[#8791A0]">
        <span className="flex items-center gap-1"><Fuel size={11} /> {vehicle.fuel_type}</span>
        <span className="flex items-center gap-1"><Gauge size={11} /> {Number(vehicle.mileage).toLocaleString()} km</span>
      </div>
      <div className={`mt-2 ${mono} text-[10.5px] text-[#5B6472] tracking-wide`}>{vehicle.vin}</div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* PRINTABLE PASSPORT  (screen-hidden, print-visible)                  */
/* ------------------------------------------------------------------ */

function PrintablePassport({ vehicle, entries, ownerName }) {
  if (!vehicle) return null;
  const services = entries.filter((e) => e.kind === "service");
  const generated = new Date().toLocaleString("sv-SE", { dateStyle: "long", timeStyle: "short" });
  const lastService = services[0];

  return (
    <div id="passport-print" className="hidden print:block text-black bg-white">
      <div className="flex items-start justify-between border-b-2 border-black pb-3">
        <div>
          <div className="text-[20px] font-bold tracking-tight">MekHjÃ¤lpen</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-600 mt-0.5">
            Digital Service Book Â· Verified Passport
          </div>
        </div>
        <div className="text-right text-[10px] text-neutral-600 leading-relaxed">
          Generated {generated}
          {ownerName && <><br />Registered owner: {ownerName}</>}
        </div>
      </div>

      <div className="mt-4">
        <div className="text-[16px] font-bold">{vehicle.year} {vehicle.make} {vehicle.model}</div>
        <table className="w-full mt-2 text-[11px] border-collapse">
          <tbody>
            <tr>
              <td className="py-1 pr-4 text-neutral-600 w-[110px]">VIN</td>
              <td className="py-1 font-mono font-semibold tracking-wide">{vehicle.vin}</td>
              <td className="py-1 pr-4 text-neutral-600 w-[110px]">Fuel</td>
              <td className="py-1">{vehicle.fuel_type}</td>
            </tr>
            <tr>
              <td className="py-1 pr-4 text-neutral-600">Body</td>
              <td className="py-1">{vehicle.body_type}</td>
              <td className="py-1 pr-4 text-neutral-600">Current mileage</td>
              <td className="py-1">{Number(vehicle.mileage).toLocaleString("sv-SE")} km</td>
            </tr>
            <tr>
              <td className="py-1 pr-4 text-neutral-600">Verified stamps</td>
              <td className="py-1">{services.length}</td>
              <td className="py-1 pr-4 text-neutral-600">Last service</td>
              <td className="py-1">{lastService ? lastService.date : "â"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-5">
        <div className="text-[11px] uppercase tracking-[0.16em] font-semibold border-b border-black pb-1 mb-2">
          Complete service history
        </div>

        {entries.length === 0 && (
          <p className="text-[11px] text-neutral-600 py-3">No entries recorded for this vehicle.</p>
        )}

        {entries.map((e) => (
          <div key={e.id} className="break-inside-avoid border-b border-neutral-300 py-2.5">
            {e.kind === "transfer" ? (
              <div className="text-[11px]">
                <span className="font-semibold">{e.date} Â· Ownership transferred</span>
                {e.subtitle && <div className="text-neutral-600 mt-0.5">{e.subtitle}</div>}
              </div>
            ) : (
              <>
                <div className="flex justify-between gap-4 text-[11.5px]">
                  <span className="font-semibold">{e.title}</span>
                  <span className="whitespace-nowrap">
                    {e.date} Â· {Number(e.mileage).toLocaleString("sv-SE")} km
                  </span>
                </div>
                <div className="text-[10px] text-neutral-600 mt-0.5">
                  Verified by {e.mechanic_name}{e.shop_name ? ` Â· ${e.shop_name}` : ""}
                </div>
                {e.notes && <div className="text-[10.5px] mt-1 leading-relaxed">{e.notes}</div>}
                {e.files?.length > 0 && (
                  <div className="text-[9.5px] text-neutral-600 mt-1">
                    Attachments on file: {e.files.map((f) => f.name).join(", ")}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      <div className="mt-5 pt-3 border-t border-black text-[9px] text-neutral-600 leading-relaxed">
        Every entry above was signed by a registered mechanic and stored against this VIN. Records in MekHjÃ¤lpen cannot be edited
        or deleted once written â not by the owner, and not by the workshop that wrote them. Attachments (receipts and photos) are
        retained digitally and can be shown by the current owner from their account.
        <div className="mt-1 font-mono">{vehicle.vin} Â· mekhjalpen</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* DIGITAL SERVICE BOOK                                                */
/* ------------------------------------------------------------------ */

function ServiceBook({ profile, vehicles, reloadVehicles, notify }) {
  const [selectedVin, setSelectedVin] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [publicVin, setPublicVin] = useState("");
  const [publicResult, setPublicResult] = useState(undefined);

  useEffect(() => {
    if (vehicles.length && !vehicles.find((v) => v.vin === selectedVin)) setSelectedVin(vehicles[0].vin);
    if (!vehicles.length) setSelectedVin(null);
  }, [vehicles, selectedVin]);

  const loadTimeline = useCallback(async (vin) => {
    if (!vin) { setTimeline([]); return; }
    setLoadingTimeline(true);
    const [{ data: records }, { data: transfers }] = await Promise.all([
      supabase.from("service_records").select("*").eq("vin", vin).order("service_date", { ascending: false }),
      supabase.from("ownership_transfers").select("*").eq("vin", vin).order("transferred_at", { ascending: false }),
    ]);
    setTimeline(buildTimeline(records || [], transfers || []));
    setLoadingTimeline(false);
  }, []);

  useEffect(() => { loadTimeline(selectedVin); }, [selectedVin, loadTimeline]);

  const searchPublic = async () => {
    const clean = publicVin.trim().toUpperCase();
    if (!clean) return;
    const { data, error } = await supabase.rpc("get_public_passport", { p_vin: clean });
    if (error) { notify(error.message, "error"); return; }
    setPublicResult(data || null);
  };

  const selected = vehicles.find((v) => v.vin === selectedVin);

  return (
    <>
    <div className="grid lg:grid-cols-[300px_1fr] gap-5 print:hidden">
      <div className="space-y-5">
        <div className="bg-[#1B2129] border border-[#2E3742] rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <Eyebrow icon={Car}>My Garage</Eyebrow>
            <button onClick={reloadVehicles} className="text-[11px] text-[#5B6472] hover:text-[#4C8DFF]">Refresh</button>
          </div>
          <div className="mt-3 space-y-2.5">
            {vehicles.length === 0 && (
              <p className="text-[12.5px] text-[#5B6472] leading-relaxed">
                No vehicles linked yet. Ask your workshop to log a service against your VIN and email â it will appear here automatically.
              </p>
            )}
            {vehicles.map((v) => (
              <VehicleCard key={v.vin} vehicle={v} selected={v.vin === selectedVin} onOpen={() => { setSelectedVin(v.vin); setPublicResult(undefined); }} />
            ))}
          </div>
        </div>

        <div className="bg-[#1B2129] border border-[#2E3742] rounded-2xl p-4">
          <Eyebrow icon={Search}>Check Any Vehicle</Eyebrow>
          <p className="text-[11.5px] text-[#5B6472] mt-1.5 mb-3">Look up the verified passport for any VIN â useful before buying a used car.</p>
          <div className="flex gap-2">
            <TextInput placeholder="Enter VIN" value={publicVin} onChange={(e) => setPublicVin(e.target.value)} className={`${mono} text-[12px] uppercase`} />
            <GhostButton icon={Search} onClick={searchPublic} className="shrink-0 px-3" />
          </div>
        </div>
      </div>

      <div className="bg-[#10141A] border border-[#2E3742] rounded-2xl p-5">
        {publicResult !== undefined ? (
          publicResult ? (
            <>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                <div>
                  <Eyebrow icon={BookOpen}>Public Passport Lookup</Eyebrow>
                  <h3 className={`text-[18px] font-semibold text-[#EDEFF2] mt-1 ${mono}`}>{publicResult.year} {publicResult.make} {publicResult.model}</h3>
                  <div className={`text-[11px] text-[#5B6472] ${mono} mt-0.5`}>{publicResult.vin}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] bg-[#34A871]/10 text-[#34A871] ring-1 ring-[#34A871]/30 px-2.5 py-1 rounded-full font-medium">Read-only view</span>
                  <GhostButton icon={Printer} onClick={() => window.print()}>Print / Export PDF</GhostButton>
                </div>
              </div>
              <PassportTimeline entries={buildTimeline(publicResult.records, publicResult.transfers)} notify={notify} />
            </>
          ) : (
            <div className="text-center py-16 text-[#5B6472] text-[13px]">No vehicle found for that VIN.</div>
          )
        ) : selected ? (
          <>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
              <Eyebrow icon={BookOpen}>Digital Service Book</Eyebrow>
              <div className="flex items-center gap-2">
                <span className="text-[11px] bg-[#4C8DFF]/10 text-[#4C8DFF] ring-1 ring-[#4C8DFF]/30 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                  <User size={11} /> Owner: {profile.full_name}
                </span>
                <GhostButton icon={Printer} onClick={() => window.print()} disabled={loadingTimeline}>
                  Print / Export PDF
                </GhostButton>
              </div>
            </div>
            <h3 className={`text-[19px] font-semibold text-[#EDEFF2] mt-1 ${mono}`}>{selected.year} {selected.make} {selected.model}</h3>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#8791A0] mt-1.5 mb-5">
              <span className={`${mono} tracking-wide`}>{selected.vin}</span>
              <span className="flex items-center gap-1"><Fuel size={11} /> {selected.fuel_type}</span>
              <span className="flex items-center gap-1"><Gauge size={11} /> {Number(selected.mileage).toLocaleString()} km</span>
            </div>
            {loadingTimeline
              ? <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-[#5B6472]" /></div>
              : <PassportTimeline entries={timeline} notify={notify} />}
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center py-16 gap-3">
            <BookOpen size={30} className="text-[#2E3742]" strokeWidth={1.5} />
            <p className="text-[#5B6472] text-[13px] max-w-[240px]">Select a vehicle from My Garage, or look up any VIN to view its passport.</p>
          </div>
        )}
      </div>
    </div>

    {/* Hidden on screen â this is what the browser actually prints */}
    <PrintablePassport
      vehicle={publicResult || selected}
      entries={publicResult ? buildTimeline(publicResult.records, publicResult.transfers) : timeline}
      ownerName={publicResult ? null : profile.full_name}
    />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* TRANSFER                                                            */
/* ------------------------------------------------------------------ */

function TransferPanel({ profile, vehicles, reloadVehicles, notify }) {
  const [selectedVin, setSelectedVin] = useState("");
  const [newOwnerName, setNewOwnerName] = useState("");
  const [newOwnerEmail, setNewOwnerEmail] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const doTransfer = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc("transfer_vehicle", {
      p_vin: selectedVin,
      p_new_owner_email: newOwnerEmail.trim(),
      p_new_owner_name: newOwnerName.trim() || null,
    });
    setBusy(false);
    if (error) { notify(error.message, "error"); return; }
    notify(
      data?.claimed
        ? `${selectedVin} transferred â the new owner can see it now.`
        : `${selectedVin} transferred. It appears in their garage when they sign up.`,
      "transfer"
    );
    setSelectedVin(""); setNewOwnerName(""); setNewOwnerEmail(""); setConfirming(false);
    reloadVehicles();
  };

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-5">
      <div className="bg-[#1B2129] border border-[#2E3742] rounded-2xl p-5">
        <Eyebrow icon={ArrowLeftRight}>Ownership Transfer</Eyebrow>
        <h2 className={`text-[19px] font-semibold text-[#EDEFF2] mt-1 mb-4 ${mono}`}>Transfer a Vehicle</h2>

        {vehicles.length === 0 ? (
          <div className="text-[13px] text-[#5B6472] py-8 text-center">You don&apos;t currently own any vehicles to transfer.</div>
        ) : (
          <>
            <FieldLabel>Vehicle</FieldLabel>
            <Select value={selectedVin} onChange={(e) => { setSelectedVin(e.target.value); setConfirming(false); }}>
              <option value="">Select a vehicle you ownâ¦</option>
              {vehicles.map((v) => (
                <option key={v.vin} value={v.vin}>{v.year} {v.make} {v.model} â {v.vin}</option>
              ))}
            </Select>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div><FieldLabel>New Owner Name</FieldLabel><TextInput value={newOwnerName} onChange={(e) => setNewOwnerName(e.target.value)} placeholder="Full name" /></div>
              <div><FieldLabel>New Owner Email</FieldLabel><TextInput type="email" value={newOwnerEmail} onChange={(e) => setNewOwnerEmail(e.target.value)} placeholder="buyer@example.se" /></div>
            </div>

            {!confirming ? (
              <PrimaryButton
                className="w-full mt-5"
                icon={ArrowRight}
                onClick={() => (selectedVin && newOwnerEmail.trim())
                  ? setConfirming(true)
                  : notify("Choose a vehicle and enter the new owner's email.", "error")}
              >
                Review Transfer
              </PrimaryButton>
            ) : (
              <div className="mt-5 border border-[#4C8DFF]/30 bg-[#4C8DFF]/[0.06] rounded-xl p-4">
                <div className="flex items-center gap-2 text-[#4C8DFF] text-[13px] font-medium mb-2">
                  <Info size={14} /> Confirm transfer
                </div>
                <p className="text-[12.5px] text-[#B3BAC5] leading-relaxed">
                  <span className={mono}>{selectedVin}</span> will move from <span className="text-[#EDEFF2]">{profile.full_name}</span> to{" "}
                  <span className="text-[#EDEFF2]">{newOwnerName || newOwnerEmail}</span>. The full verified service history stays permanently attached to the VIN â you will lose viewing access immediately.
                </p>
                <div className="flex gap-2 mt-3">
                  <PrimaryButton icon={busy ? Loader2 : CheckCircle2} spinning={busy} disabled={busy} onClick={doTransfer}>
                    {busy ? "Transferringâ¦" : "Confirm & Transfer"}
                  </PrimaryButton>
                  <GhostButton onClick={() => setConfirming(false)}>Cancel</GhostButton>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="bg-[#10141A] border border-[#2E3742] rounded-2xl p-5 h-fit">
        <Eyebrow icon={Fingerprint}>Why This Matters</Eyebrow>
        <div className="mt-3 space-y-3 text-[13px] text-[#8791A0] leading-relaxed">
          <p>The passport is bound to the VIN, not the account. A sale never resets or hides prior service history.</p>
          <p>The new owner gets instant access to every verified stamp the moment the transfer completes â and a transfer stamp is added to the timeline for full traceability.</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* APP SHELL                                                           */
/* ------------------------------------------------------------------ */

export default function MekHjalpen() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [booting, setBooting] = useState(true);
  const [tab, setTab] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const notify = useCallback((message, tone = "verified") => {
    setToast({ message, tone });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3600);
  }, []);

  // Auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setBooting(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (!s) { setProfile(null); setVehicles([]); setTab(null); }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Profile
  useEffect(() => {
    if (!session?.user) return;
    (async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
      if (error) { notify(error.message, "error"); return; }
      setProfile(data);
      setTab(data?.role === "mechanic" ? "diagnostic" : "book");
    })();
  }, [session, notify]);

  const reloadVehicles = useCallback(async () => {
    if (!session?.user) return;
    const { data } = await supabase.from("vehicles").select("*").eq("owner_id", session.user.id).order("created_at", { ascending: false });
    setVehicles(data || []);
  }, [session]);

  useEffect(() => { if (profile?.role === "customer") reloadVehicles(); }, [profile, reloadVehicles]);

  if (booting) {
    return (
      <div className="min-h-screen bg-[#10141A] flex items-center justify-center">
        <Loader2 size={22} className="animate-spin text-[#5B6472]" />
      </div>
    );
  }

  if (!session) return (<><Toast toast={toast} /><AuthScreen notify={notify} /></>);

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#10141A] flex items-center justify-center">
        <Loader2 size={22} className="animate-spin text-[#5B6472]" />
      </div>
    );
  }

  const isMechanic = profile.role === "mechanic";
  const accent = isMechanic ? "#FFB020" : "#4C8DFF";
  const tabs = isMechanic
    ? [
        ["diagnostic", "Diagnostic Workspace", ScanLine],
        ["logger", "Service Logger", ClipboardList],
        ["stamps", "Recent Stamps", History],
      ]
    : [["book", "Service Book", BookOpen], ["transfer", "Transfer Ownership", ArrowLeftRight]];

  return (
    <div className="min-h-screen bg-[#10141A] text-[#EDEFF2]">
      <Toast toast={toast} />

      <header className="border-b border-[#2E3742] bg-[#0D1117]/80 backdrop-blur sticky top-0 z-40 print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#FFB020]/12 border border-[#FFB020]/30 flex items-center justify-center">
              <Wrench size={17} className="text-[#FFB020]" strokeWidth={2.25} />
            </div>
            <div>
              <div className={`text-[16px] font-bold tracking-tight ${mono}`}>MekHjÃ¤lpen</div>
              <div className="text-[10.5px] text-[#5B6472] tracking-[0.14em] uppercase -mt-0.5">Diagnostics Â· Digital Passport</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full border"
              style={{ color: accent, borderColor: `${accent}55`, background: `${accent}14` }}
            >
              {isMechanic ? <Wrench size={13} /> : <BookOpen size={13} />}
              {isMechanic ? "Mechanic" : "Car owner"}
            </span>
            <button
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-1.5 text-[12px] text-[#8791A0] hover:text-[#E5484D] transition-colors"
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1.5">
            {tabs.map(([k, label, Icon]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors border"
                style={tab === k
                  ? { background: "#1B2129", color: accent, borderColor: `${accent}4D` }
                  : { color: "#8791A0", borderColor: "transparent" }}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-[11.5px] text-[#8791A0]">
            {isMechanic ? <Building2 size={13} className="text-[#5B6472]" /> : <Mail size={13} className="text-[#5B6472]" />}
            {profile.full_name}{profile.shop_name ? ` Â· ${profile.shop_name}` : ` Â· ${profile.email}`}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {isMechanic && tab === "diagnostic" && <DiagnosticWorkspace profile={profile} notify={notify} />}
        {isMechanic && tab === "logger" && <ServiceLogger profile={profile} notify={notify} />}
        {isMechanic && tab === "stamps" && <RecentStamps profile={profile} notify={notify} />}
        {!isMechanic && tab === "book" && (
          <ServiceBook profile={profile} vehicles={vehicles} reloadVehicles={reloadVehicles} notify={notify} />
        )}
        {!isMechanic && tab === "transfer" && (
          <TransferPanel profile={profile} vehicles={vehicles} reloadVehicles={reloadVehicles} notify={notify} />
        )}
      </main>

      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex items-center gap-2 text-[11px] text-[#3E4750] print:hidden">
        <Fingerprint size={12} /> Every stamp is VIN-bound and permanent â history follows the car, not the account.
      </footer>
    </div>
  );
}
