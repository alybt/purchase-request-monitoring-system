"use client";

import { useState, useEffect } from "react";
import UserTableWithActions from "@/features/users/components/UserTableWithActions";
import UserFormModal from "@/features/users/components/UserFormModal";
import ViewUserModal from "@/features/users/components/ViewUserModal";
import DeleteUserModal from "@/features/users/components/DeleteUserModal";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  bulkDeleteUsers,
  UserData,
} from "@/services/users.service";

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters state
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);

  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingUser, setViewingUser] = useState<UserData | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);

  const fetchUsersData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getUsers(search, roleFilter, statusFilter, deptFilter);
      setUsers(data);
    } catch (err: any) {
      setError(err.message || "Failed to load users from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsersData();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, roleFilter, statusFilter, deptFilter]);

  // Handle Add User
  const handleAddUser = () => {
    setIsEditMode(false);
    setEditingUser(null);
    setShowFormModal(true);
  };

  // Handle Edit User
  const handleEditUser = (user: UserData) => {
    setIsEditMode(true);
    setEditingUser(user);
    setShowFormModal(true);
  };

  // Handle View User
  const handleViewUser = (user: UserData) => {
    setViewingUser(user);
    setShowViewModal(true);
  };

  // Handle Delete Single User
  const handleDeleteUser = (user: UserData) => {
    setIsDeleteMode(true);
    setUserToDelete(user);
    setSelectedRows([user.id]);
    setShowDeleteModal(true);
  };

  // Handle Delete Multiple Users
  const handleDeleteMultiple = () => {
    if (selectedRows.length === 0) return;
    setShowDeleteModal(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    setError("");
    try {
      if (selectedRows.length > 1) {
        await bulkDeleteUsers(selectedRows);
        setUsers(users.filter((user) => !selectedRows.includes(user.id)));
      } else if (selectedRows.length === 1) {
        await deleteUser(selectedRows[0]);
        setUsers(users.filter((user) => user.id !== selectedRows[0]));
      } else if (userToDelete) {
        await deleteUser(userToDelete.id);
        setUsers(users.filter((user) => user.id !== userToDelete.id));
      }
      setSelectedRows([]);
      setShowDeleteModal(false);
      setIsDeleteMode(false);
      setUserToDelete(null);
    } catch (err: any) {
      setError(err.message || "Failed to delete selected user(s).");
      setShowDeleteModal(false);
    }
  };

  // Handle Form Submit
  const handleFormSubmit = async (data: any) => {
    setError("");
    try {
      if (isEditMode && editingUser) {
        const updated = await updateUser(editingUser.id, data);
        setUsers(
          users.map((user) =>
            user.id === editingUser.id ? updated : user
          )
        );
      } else {
        const created = await createUser(data);
        setUsers([created, ...users]);
      }
      setShowFormModal(false);
      setEditingUser(null);
    } catch (err: any) {
      setError(err.message || "Operation failed.");
      setShowFormModal(false);
    }
  };

  const handleToggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode);
    setSelectedRows([]);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 min-h-screen bg-slate-50 p-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary">
            User & Role Management
          </h1>
          <p className="text-secondary/70 text-sm mt-1">
            Manage system access, department roles, and permissions.
          </p>
        </div>

        <button
          onClick={handleAddUser}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
          Add New User
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm relative">
          <span className="font-semibold">Error: </span>
          {error}
        </div>
      )}

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        {/* Toolbar (Search & Filter) */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <div className="relative w-full max-w-md">
            <svg
              className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-secondary placeholder-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex-1 sm:flex-none border px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2 ${
                showFilters || roleFilter || statusFilter || deptFilter
                  ? "border-primary/50 bg-primary/5 text-primary"
                  : "border-slate-200 text-secondary bg-white hover:bg-slate-50"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              Filter
            </button>

            <button
              onClick={handleToggleDeleteMode}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2 ${
                isDeleteMode
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "border border-slate-200 text-secondary bg-white hover:bg-slate-50"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              {isDeleteMode ? "Cancel" : "Delete"}
            </button>

            {isDeleteMode && selectedRows.length > 0 && (
              <button
                onClick={handleDeleteMultiple}
                className="flex-1 sm:flex-none bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M5 13a3 3 0 015 0v6a3 3 0 01-5 0v-6z" />
                  <path d="M14 13a3 3 0 015 0v6a3 3 0 01-5 0v-6z" />
                </svg>
                Delete {selectedRows.length} User
                {selectedRows.length > 1 ? "s" : ""}
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Filters Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl transition-all">
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white text-secondary"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="approver">Approver</option>
                <option value="requester">Requester (Employee)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white text-secondary"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive (Suspended)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-secondary mb-1">Department</label>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white text-secondary"
              >
                <option value="">All Departments</option>
                {["IT", "HR", "Finance", "Operations", "Marketing", "Sales"].map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-primary mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm text-slate-400 font-medium">Fetching users from database...</span>
          </div>
        ) : (
          /* Feature Component */
          <UserTableWithActions
            data={users}
            selectedRows={selectedRows}
            onSelectRows={setSelectedRows}
            onView={handleViewUser}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            showCheckboxes={isDeleteMode}
          />
        )}
      </div>

      {/* Modals */}
      <UserFormModal
        isOpen={showFormModal}
        isEditMode={isEditMode}
        initialData={editingUser || undefined}
        onClose={() => {
          setShowFormModal(false);
          setEditingUser(null);
        }}
        onSubmit={handleFormSubmit}
      />

      <ViewUserModal
        isOpen={showViewModal}
        user={viewingUser}
        onClose={() => setShowViewModal(false)}
      />

      <DeleteUserModal
        isOpen={showDeleteModal}
        selectedCount={selectedRows.length}
        onClose={() => {
          setShowDeleteModal(false);
          if (!isDeleteMode) {
            setUserToDelete(null);
            setSelectedRows([]);
          }
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
