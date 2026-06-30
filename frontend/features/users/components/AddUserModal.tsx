"use client";

import { useState, useEffect } from "react";

export interface UserFormData {
  id?: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  email: string;
  department: string;
  role: "admin" | "department_head";
  status: "active" | "inactive";
  password?: string;
  password_confirmation?: string;
}

interface UserFormModalProps {
  isOpen: boolean;
  isEditMode: boolean;
  initialData?: UserFormData;
  departments?: Array<{ id: number; name: string; code: string }>;
  onClose: () => void;
  onSubmit: (data: UserFormData) => void;
}

const roles = ["admin", "department_head"];

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
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
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

export default function UserFormModal({
  isOpen,
  isEditMode,
  initialData,
  departments = [],
  onClose,
  onSubmit,
}: UserFormModalProps) {
  const defaultForm: UserFormData = {
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    department: departments[0]?.name || "",
    role: "department_head",
    status: "active",
    password: "",
    password_confirmation: "",
  };

  const [formData, setFormData] = useState<UserFormData>(initialData || defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = getPasswordStrength(formData.password || "");

  useEffect(() => {
    if (!isOpen) return;
    setFormData(
      initialData || {
        ...defaultForm,
        department: departments[0]?.name || "",
      }
    );
    setErrors({});
    setShowPassword(false);
    setShowConfirm(false);
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.first_name.trim()) newErrors.first_name = "First name is required";
    if (!formData.last_name.trim()) newErrors.last_name = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email format";
    if (!formData.department) newErrors.department = "Department is required";

    // Password fields are only required when creating a new user
    if (!isEditMode) {
      if (!formData.password) {
        newErrors.password = "Temporary password is required";
      } else if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      } else if (!/[A-Za-z]/.test(formData.password)) {
        newErrors.password = "Password must contain at least one letter";
      } else if (!/[0-9]/.test(formData.password)) {
        newErrors.password = "Password must contain at least one number";
      }
      if (!formData.password_confirmation) {
        newErrors.password_confirmation = "Please confirm the password";
      } else if (formData.password !== formData.password_confirmation) {
        newErrors.password_confirmation = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const n = { ...prev };
        delete n[name];
        return n;
      });
    }
  };

  if (!isOpen) return null;

  const inputBase =
    "w-full border rounded-lg px-3 py-2 text-sm text-secondary focus:outline-none focus:ring-2 transition-all";
  const inputNormal = `${inputBase} border-slate-200 focus:ring-primary/50`;
  const inputError = `${inputBase} border-red-500 focus:ring-red-500/50 bg-red-50`;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 shrink-0">
          <h2 className="text-lg font-bold text-secondary">
            {isEditMode ? "Edit User" : "Add New User"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-secondary transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-4">
            {/* Name Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="Enter first name"
                  className={errors.first_name ? inputError : inputNormal}
                />
                {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">Middle Name</label>
                <input
                  type="text"
                  name="middle_name"
                  value={formData.middle_name || ""}
                  onChange={handleChange}
                  placeholder="Optional"
                  className={inputNormal}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-secondary mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Enter last name"
                  className={errors.last_name ? inputError : inputNormal}
                />
                {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                className={errors.email ? inputError : inputNormal}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">
                Department <span className="text-red-500">*</span>
              </label>
              {departments.length > 0 ? (
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className={errors.department ? inputError : inputNormal}
                >
                  <option value="">Select department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="Enter department name"
                  className={errors.department ? inputError : inputNormal}
                />
              )}
              {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={inputNormal}
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role === "admin" ? "Administrator" : "Department Head"}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-secondary mb-2">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={inputNormal}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Temporary Password — only shown when creating a new user */}
            {!isEditMode && (
              <div className="pt-2 border-t border-slate-100 space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-secondary/50 mb-3 flex items-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Temporary Password
                  </p>
                  <p className="text-xs text-secondary/50 mb-3 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                    The user will be required to change this password on their first login.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-secondary mb-2">
                    Temporary Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password || ""}
                      onChange={handleChange}
                      placeholder="Min. 8 chars, letters & numbers"
                      className={`${errors.password ? inputError : inputNormal} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary/40 hover:text-secondary transition-colors"
                    >
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>

                  {/* Strength bar */}
                  {formData.password && (
                    <div className="mt-1.5 space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${strength.score >= i ? strength.color : "bg-slate-200"}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-medium text-secondary/60">{strength.label}</span>
                    </div>
                  )}
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-secondary mb-2">
                    Confirm Temporary Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      name="password_confirmation"
                      value={formData.password_confirmation || ""}
                      onChange={handleChange}
                      placeholder="Re-enter the password"
                      className={`${errors.password_confirmation ? inputError : inputNormal} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary/40 hover:text-secondary transition-colors"
                    >
                      <EyeIcon open={showConfirm} />
                    </button>
                  </div>
                  {errors.password_confirmation && <p className="text-red-500 text-xs mt-1">{errors.password_confirmation}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="px-6 py-4 border-t border-slate-200 shrink-0 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-200 text-secondary bg-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              {isEditMode ? "Update User" : "Add User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
