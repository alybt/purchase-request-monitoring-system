"use client";

import { useState } from "react";
import PageHeader from "@/components/ui/PageHeader";

export default function EmployeeProfilePage() {
  const [name, setName] = useState("Juan dela Cruz");
  const [email, setEmail] = useState("juan.dc@prms.com");
  const [department, setDepartment] = useState("IT");
  const [emailNotif, setEmailNotif] = useState(true);
  const [inAppNotif, setInAppNotif] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saveStatus, setSaveStatus] = useState<"" | "saved" | "error">("");
  const [pwStatus, setPwStatus] = useState<"" | "saved" | "error" | "mismatch">("");

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus(""), 2500);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwStatus("mismatch");
      return;
    }
    if (newPassword.length < 8) {
      setPwStatus("error");
      return;
    }
    setPwStatus("saved");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPwStatus(""), 2500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Profile & Settings"
        subtitle="Manage your personal information and preferences"
        breadcrumbs={[{ label: "Employee" }, { label: "Profile & Settings" }]}
      />

      {/* Personal Information */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-bold text-secondary mb-5 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Personal Information
        </h2>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
            <span className="text-2xl font-extrabold text-primary">J</span>
          </div>
          <div>
            <p className="text-sm font-bold text-secondary">{name}</p>
            <p className="text-xs text-secondary/50">{email}</p>
            <p className="text-xs text-secondary/50 capitalize">Employee · {department}</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-secondary mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-secondary mb-1.5">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {["IT", "HR", "Finance", "Operations", "Marketing", "Sales"].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-secondary mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {saveStatus === "saved" && (
              <p className="text-sm font-semibold text-emerald-600 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Profile updated successfully!
              </p>
            )}
            <div className="ml-auto">
              <button type="submit" className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-bold text-secondary mb-5 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Notification Preferences
        </h2>

        <div className="space-y-4">
          {[
            { label: "Email Notifications", desc: "Receive approval updates and system alerts via email", value: emailNotif, setter: setEmailNotif },
            { label: "In-App Notifications", desc: "Show real-time notifications within the system", value: inAppNotif, setter: setInAppNotif },
          ].map((pref) => (
            <label key={pref.label} className="flex items-center justify-between cursor-pointer group">
              <div>
                <p className="text-sm font-semibold text-secondary">{pref.label}</p>
                <p className="text-xs text-secondary/50">{pref.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => pref.setter(!pref.value)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  pref.value ? "bg-primary" : "bg-slate-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                    pref.value ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </label>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-bold text-secondary mb-5 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Security
        </h2>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-secondary mb-1.5">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-secondary mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Min. 8 characters"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-secondary mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Re-enter new password"
                className={`w-full border rounded-xl px-4 py-2.5 text-sm text-secondary focus:outline-none focus:ring-2 ${
                  pwStatus === "mismatch" ? "border-red-300 focus:ring-red-300" : "border-slate-200 focus:ring-primary/40"
                }`}
              />
            </div>
          </div>

          {pwStatus === "mismatch" && <p className="text-sm text-red-500 font-medium">Passwords do not match.</p>}
          {pwStatus === "error" && <p className="text-sm text-red-500 font-medium">Password must be at least 8 characters.</p>}
          {pwStatus === "saved" && <p className="text-sm text-emerald-600 font-semibold">Password changed successfully!</p>}

          <div className="flex justify-end">
            <button type="submit" className="bg-secondary text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-secondary/90 transition-colors">
              Change Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
