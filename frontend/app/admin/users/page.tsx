"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/ui/PageHeader";
import SearchFilters from "@/components/ui/SearchFilters";
import EmptyState from "@/components/ui/EmptyState";
import UserFormModal from "@/features/users/components/AddUserModal";
import DeleteConfirmationModal from "@/components/ui/DeleteConfirmationModal";
import UserTable from "@/features/users/components/UserTable";
import ViewUserModal from "@/features/users/components/ViewUserModal";
import { getUsers, createUser, updateUser, bulkDeleteUsers } from "@/services/users.service";
import type { UserData } from "@/services/users.service";
import type { UserFormData } from "@/features/users/components/AddUserModal";

const API_URL = "http://127.0.0.1:8000/api";
function getHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface Department {
  id: number;
  name: string;
  code: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [formError, setFormError] = useState("");

  // Modal states
  const [showAdd, setShowAdd] = useState(false);
  const [viewUser, setViewUser] = useState<UserData | null>(null);
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, [search, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers(search, roleFilter, statusFilter, "");
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_URL}/departments`, { headers: getHeaders() });
      const data = await res.json();
      setDepartments(data.departments || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddUser = async (data: UserFormData) => {
    setFormError("");
    try {
      const newUser = await createUser(data as any);
      setUsers((prev) => [newUser, ...prev]);
      setShowAdd(false);
    } catch (err: any) {
      setFormError(err.message || "Failed to create user.");
      console.error(err);
    }
  };

  const handleEditUser = async (data: UserFormData) => {
    if (!editUser?.id) return;
    setFormError("");
    try {
      const updatedUser = await updateUser(editUser.id, data as any);
      setUsers((prev) =>
        prev.map((u) => (u.id === editUser.id ? updatedUser : u))
      );
      setEditUser(null);
    } catch (err: any) {
      setFormError(err.message || "Failed to update user.");
      console.error(err);
    }
  };

  const [isDeleteMode, setIsDeleteMode] = useState(false);

  const handleDeleteConfirm = async () => {
    try {
      await bulkDeleteUsers(selectedRows);
      setUsers((prev) => prev.filter((u) => !selectedRows.includes(u.id)));
      setSelectedRows([]);
      setShowDelete(false);
      setIsDeleteMode(false);
    } catch (err) {
      console.error(err);
    }
  };

  const toFormData = (u: UserData): UserFormData => ({
    id: u.id,
    first_name: u.first_name,
    middle_name: u.middle_name,
    last_name: u.last_name,
    email: u.email,
    department: u.department,
    role: u.role as "admin" | "department_head",
    status: u.status,
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="User & Role Management"
        subtitle={`${users.length} total users`}
        breadcrumbs={[{ label: "Admin" }, { label: "Users" }]}
        actions={
          <div className="flex items-center gap-2">
            {!isDeleteMode ? (
              <button
                onClick={() => setIsDeleteMode(true)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm flex items-center justify-center gap-2 border border-slate-200 text-secondary bg-white hover:bg-slate-50"
              >
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setIsDeleteMode(false); setSelectedRows([]); }}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm bg-white border border-slate-200 text-secondary hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowDelete(true)}
                  className="bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  Delete ({selectedRows.length})
                </button>
              </div>
            )}
            
            {!isDeleteMode && (
              <button
                id="add-user-btn"
                onClick={() => { setFormError(""); setShowAdd(true); }}
                className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add User
              </button>
            )}
          </div>
        }
      />

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SearchFilters
            searchValue={search}
            onSearchChange={setSearch}
            placeholder="Search users by name, email or department..."
            filters={[
              {
                label: "Role",
                value: roleFilter,
                onChange: setRoleFilter,
                options: [
                  { label: "Admin", value: "admin" },
                  { label: "Department Head", value: "department_head" },
                ],
              },
              {
                label: "Status",
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  { label: "Active", value: "active" },
                  { label: "Inactive", value: "inactive" },
                ],
              },
            ]}  
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-secondary/50">Loading users...</div>
        ) : users.length === 0 ? (
          <EmptyState
            title="No users found"
            description="Try adjusting your search or filters."
          />
        ) : (
          <UserTable
            data={users}
            selectedRows={selectedRows}
            onSelectRows={setSelectedRows}
            onView={setViewUser}
            onEdit={setEditUser}
            onDelete={(u) => { setSelectedRows([u.id]); setShowDelete(true); }}
            isDeleteMode={isDeleteMode}
            onToggleDeleteMode={() => {
              setIsDeleteMode(!isDeleteMode);
              if (isDeleteMode) setSelectedRows([]);
            }}
            onConfirmBulkDelete={() => setShowDelete(true)}
          />
        )}
      </div>

      {/* Modals */}
      {showAdd && (
        <UserFormModal
          isOpen={showAdd}
          isEditMode={false}
          departments={departments}
          onClose={() => { setShowAdd(false); setFormError(""); }}
          onSubmit={handleAddUser}
        />
      )}
      {viewUser && (
        <ViewUserModal
          isOpen={!!viewUser}
          user={viewUser}
          onClose={() => setViewUser(null)}
        />
      )}
      {editUser && (
        <UserFormModal
          isOpen={!!editUser}
          isEditMode={true}
          initialData={toFormData(editUser)}
          departments={departments}
          onClose={() => { setEditUser(null); setFormError(""); }}
          onSubmit={handleEditUser}
        />
      )}
      {showDelete && (
        <DeleteConfirmationModal
          isOpen={showDelete}
          selectedCount={selectedRows.length}
          entityName="User"
          onClose={() => { 
            setShowDelete(false); 
            if (!isDeleteMode) setSelectedRows([]);
          }}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
