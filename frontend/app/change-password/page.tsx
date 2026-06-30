"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Password strength checker
function getPasswordStrength(password: string): {
  score: number; // 0-4
  label: string;
  color: string;
} {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  score = Math.min(score, 4);
  const levels = [
    { label: "Very Weak", color: "bg-red-500" },
    { label: "Weak", color: "bg-orange-400" },
    { label: "Fair", color: "bg-amber-400" },
    { label: "Good", color: "bg-lime-500" },
    { label: "Strong", color: "bg-emerald-500" },
  ];
  return { score, ...levels[score] };
}

const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");

  const strength = getPasswordStrength(newPassword);

  // Ensure only authenticated users land here
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!currentPassword.trim()) newErrors.current_password = "Current password is required.";
    if (!newPassword) {
      newErrors.new_password = "New password is required.";
    } else if (newPassword.length < 8) {
      newErrors.new_password = "Password must be at least 8 characters.";
    } else if (!/[A-Za-z]/.test(newPassword)) {
      newErrors.new_password = "Password must contain at least one letter.";
    } else if (!/[0-9]/.test(newPassword)) {
      newErrors.new_password = "Password must contain at least one number.";
    }
    if (!confirmPassword) {
      newErrors.confirm_password = "Please confirm your new password.";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirm_password = "Passwords do not match.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const { changePassword, getCurrentUser } = await import("@/services/auth.service");
      const data = await changePassword(currentPassword, newPassword, confirmPassword);

      // Update stored user with new must_change_password = false
      const updatedUser = data.user;
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...storedUser, ...updatedUser }));

      // Redirect to the role-appropriate dashboard
      const { roleHomePath } = await import("@/lib/auth-utils");
      const role = updatedUser.role as "admin" | "department_head";
      router.push(roleHomePath(role));
    } catch (err: any) {
      const fieldErrors = err.errors || {};
      const mapped: Record<string, string> = {};
      if (fieldErrors.current_password) mapped.current_password = fieldErrors.current_password[0];
      if (fieldErrors.new_password) mapped.new_password = fieldErrors.new_password[0];
      setErrors(mapped);
      if (!Object.keys(mapped).length) {
        setServerError(err.message || "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a251f] flex items-center justify-center p-4">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-primary/10 -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-gold/10 translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/30">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">
              PR<span className="text-primary">.</span>System
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 px-8 py-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-secondary">Change Your Password</h1>
                <p className="text-secondary/60 text-sm">Secure your account before continuing</p>
              </div>
            </div>
          </div>

          {/* Security notice */}
          <div className="mx-8 mt-6 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
            <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-xs text-amber-800 font-medium leading-relaxed">
              Your account requires a password change. You must set a new password to access the system.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {serverError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
                {serverError}
              </div>
            )}

            {/* Current Password */}
            <div>
              <label className="block text-sm font-semibold text-secondary mb-1.5">
                Current Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="current-password"
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (errors.current_password) setErrors((prev) => { const n = { ...prev }; delete n.current_password; return n; });
                  }}
                  placeholder="Enter your current password"
                  className={`w-full border rounded-xl px-4 py-3 pr-12 text-sm text-secondary focus:outline-none focus:ring-2 transition-all ${
                    errors.current_password
                      ? "border-red-400 focus:ring-red-400/40 bg-red-50"
                      : "border-slate-200 focus:ring-primary/40 focus:border-primary"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary/40 hover:text-secondary transition-colors"
                >
                  <EyeIcon open={showCurrent} />
                </button>
              </div>
              {errors.current_password && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  {errors.current_password}
                </p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-semibold text-secondary mb-1.5">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (errors.new_password) setErrors((prev) => { const n = { ...prev }; delete n.new_password; return n; });
                  }}
                  placeholder="Enter your new password"
                  className={`w-full border rounded-xl px-4 py-3 pr-12 text-sm text-secondary focus:outline-none focus:ring-2 transition-all ${
                    errors.new_password
                      ? "border-red-400 focus:ring-red-400/40 bg-red-50"
                      : "border-slate-200 focus:ring-primary/40 focus:border-primary"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary/40 hover:text-secondary transition-colors"
                >
                  <EyeIcon open={showNew} />
                </button>
              </div>

              {/* Password strength indicator */}
              {newPassword && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          strength.score >= i ? strength.color : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-semibold" style={{ color: strength.score <= 1 ? "#ef4444" : strength.score <= 2 ? "#f59e0b" : "#22c55e" }}>
                    Password strength: {strength.label}
                  </p>
                </div>
              )}

              {errors.new_password && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  {errors.new_password}
                </p>
              )}

              {/* Password requirements */}
              <div className="mt-2 space-y-1">
                {[
                  { label: "At least 8 characters", ok: newPassword.length >= 8 },
                  { label: "At least one letter", ok: /[A-Za-z]/.test(newPassword) },
                  { label: "At least one number", ok: /[0-9]/.test(newPassword) },
                ].map(({ label, ok }) => (
                  <div key={label} className="flex items-center gap-1.5 text-xs">
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 transition-all ${ok ? "bg-emerald-500" : "bg-slate-200"}`}>
                      {ok && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={ok ? "text-emerald-700 font-medium" : "text-secondary/50"}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-secondary mb-1.5">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirm_password) setErrors((prev) => { const n = { ...prev }; delete n.confirm_password; return n; });
                  }}
                  placeholder="Re-enter your new password"
                  className={`w-full border rounded-xl px-4 py-3 pr-12 text-sm text-secondary focus:outline-none focus:ring-2 transition-all ${
                    errors.confirm_password
                      ? "border-red-400 focus:ring-red-400/40 bg-red-50"
                      : confirmPassword && newPassword === confirmPassword
                      ? "border-emerald-400 focus:ring-emerald-400/40"
                      : "border-slate-200 focus:ring-primary/40 focus:border-primary"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary/40 hover:text-secondary transition-colors"
                >
                  <EyeIcon open={showConfirm} />
                </button>
                {confirmPassword && newPassword === confirmPassword && (
                  <div className="absolute right-10 top-1/2 -translate-y-1/2 text-emerald-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
              </div>
              {errors.confirm_password && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  {errors.confirm_password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              id="save-password-btn"
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                "Save New Password"
              )}
            </button>
          </form>

          <p className="text-center text-xs text-secondary/40 pb-6">
            Purchase Request Monitoring System v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
