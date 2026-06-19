"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/ui/PageHeader";
import SearchFilters from "@/components/ui/SearchFilters";
import EmptyState from "@/components/ui/EmptyState";
// Re-use existing user CRUD components
import UserFormModal from "@/features/users/components/AddUserModal";
import DeleteUserModal from "@/features/users/components/DeleteUserModal";
import UserTable from "@/features/users/components/UserTable";
import ViewUserModal from "@/features/users/components/ViewUserModal";
import { getUsers, createUser, updateUser, bulkDeleteUsers } from "@/services/users.service";
import type { UserData } from "@/services/users.service";
import type { UserFormData } from "@/features/users/components/AddUserModal";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Modal states
  const [showAdd, setShowAdd] = useState(false);
  const [viewUser, setViewUser] = useState<UserData | null>(null);
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    fetchUsers();
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

  const handleAddUser = async (data: UserFormData) => {
    try {
      const newUser = await createUser(data as any);
      setUsers((prev) => [newUser, ...prev]);
      setShowAdd(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditUser = async (data: UserFormData) => {
    if (!editUser?.id) return;
    try {
      const updatedUser = await updateUser(editUser.id, data as any);
      setUsers((prev) =>
        prev.map((u) => (u.id === editUser.id ? updatedUser : u))
      );
      setEditUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await bulkDeleteUsers(selectedRows);
      setUsers((prev) => prev.filter((u) => !selectedRows.includes(u.id)));
      setSelectedRows([]);
      setShowDelete(false);
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
    role: u.role as "admin" | "approver" | "requester",
    status: u.status,
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="User & Role Management"
        subtitle={`${users.length} total users`}
        breadcrumbs={[{ label: "Admin" }, { label: "Users" }]}
        actions={
          <button
            id="add-user-btn"
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add User
          </button>
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
                  { label: "Approver", value: "approver" },
                  { label: "Requester", value: "requester" },
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
          {selectedRows.length > 0 && (
            <button
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-2 bg-red-500 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete ({selectedRows.length})
            </button>
          )}
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
            showCheckboxes={true}
          />
        )}
      </div>

      {/* Modals */}
      {showAdd && (
        <UserFormModal
          isOpen={showAdd}
          isEditMode={false}
          onClose={() => setShowAdd(false)}
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
          onClose={() => setEditUser(null)}
          onSubmit={handleEditUser}
        />
      )}
      {showDelete && (
        <DeleteUserModal
          isOpen={showDelete}
          selectedCount={selectedRows.length}
          onClose={() => { setShowDelete(false); setSelectedRows([]); }}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
