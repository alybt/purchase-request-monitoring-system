<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = User::query();

            // Search filter (name or email)
            if ($request->filled('search')) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('middle_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            // Role filter
            if ($request->filled('role')) {
                $query->where('role', $request->input('role'));
            }

            // Status filter
            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            // Department filter
            if ($request->filled('department')) {
                $dept = $request->input('department');
                if (is_numeric($dept)) {
                    $query->where('department_id', $dept);
                } else {
                    $query->whereHas('department', function ($q) use ($dept) {
                        $q->where('name', $dept)->orWhere('code', $dept);
                    });
                }
            }

            $users = $query->with('department')->orderBy('id', 'desc')->paginate($request->integer('per_page', 15));

            return response()->json([
                'users' => $users->items(),
                'pagination' => [
                    'current_page' => $users->currentPage(),
                    'last_page' => $users->lastPage(),
                    'per_page' => $users->perPage(),
                    'total' => $users->total(),
                ]
            ], 200);
        } catch (\Throwable $e) {
            Log::error('List users failure: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An unexpected error occurred. Please try again later.'
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $fields = $request->validate([
                'first_name' => 'required|string|max:100',
                'middle_name' => 'nullable|string|max:100',
                'last_name' => 'required|string|max:100',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8',
                'role' => 'nullable|string|in:admin,department_head,approver,employee',
                'status' => 'nullable|string|in:active,dismissed,suspended',
                'department' => 'nullable|string|max:100',
                'department_id' => 'nullable|integer|exists:departments,id',
            ]);

            if (isset($fields['department']) && !isset($fields['department_id'])) {
                $dept = \App\Models\Department::where('name', $fields['department'])->orWhere('code', $fields['department'])->first();
                if ($dept) {
                    $fields['department_id'] = $dept->id;
                }
            }
            unset($fields['department']);

            $fields['password'] = bcrypt($fields['password']);
            // Map legacy roles to department_head
            if (in_array($fields['role'] ?? '', ['approver', 'employee'])) {
                $fields['role'] = 'department_head';
            } else {
                $fields['role'] = $fields['role'] ?? 'department_head';
            }
            $fields['status'] = $fields['status'] ?? 'active';

            $user = User::create($fields);

            return response()->json([
                'message' => 'User created successfully.',
                'user' => $user
            ], 201);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('Create user failure: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An unexpected error occurred. Please try again later.'
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $user = User::find($id);

            if (!$user) {
                return response()->json([
                    'message' => 'User not found.'
                ], 404);
            }

            return response()->json([
                'user' => $user
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Get single user failure: ' . $e->getMessage(), [
                'user_id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An unexpected error occurred. Please try again later.'
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $user = User::find($id);

            if (!$user) {
                return response()->json([
                    'message' => 'User not found.'
                ], 404);
            }

            $fields = $request->validate([
                'first_name' => 'required|string|max:100',
                'middle_name' => 'nullable|string|max:100',
                'last_name' => 'required|string|max:100',
                'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
                'password' => 'nullable|string|min:8',
                'role' => 'nullable|string|in:admin,department_head,approver,employee',
                'status' => 'nullable|string|in:active,dismissed,suspended',
                'department' => 'nullable|string|max:100',
                'department_id' => 'nullable|integer|exists:departments,id',
            ]);

            if (isset($fields['department']) && !isset($fields['department_id'])) {
                $dept = \App\Models\Department::where('name', $fields['department'])->orWhere('code', $fields['department'])->first();
                if ($dept) {
                    $fields['department_id'] = $dept->id;
                }
            }
            unset($fields['department']);

            if (isset($fields['role']) && in_array($fields['role'], ['approver', 'employee'])) {
                $fields['role'] = 'department_head';
            }

            if (isset($fields['password']) && !empty($fields['password'])) {
                $fields['password'] = bcrypt($fields['password']);
            } else {
                unset($fields['password']);
            }

            $user->update($fields);

            return response()->json([
                'message' => 'User updated successfully.',
                'user' => $user
            ], 200);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('Update user failure: ' . $e->getMessage(), [
                'user_id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An unexpected error occurred. Please try again later.'
            ], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        try {
            $user = User::find($id);

            if (!$user) {
                return response()->json([
                    'message' => 'User not found.'
                ], 404);
            }

            // Prevent self-deletion
            if ($request_user = $request->user()) {
                if ($request_user->id === $user->id) {
                    return response()->json([
                        'message' => 'You cannot delete your own account.'
                    ], 403);
                }
            }

            $user->delete();

            return response()->json([
                'message' => 'User deleted successfully.'
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Delete user failure: ' . $e->getMessage(), [
                'user_id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An unexpected error occurred. Please try again later.'
            ], 500);
        }
    }

    public function bulkDestroy(Request $request)
    {
        try {
            $request->validate([
                'ids' => 'required|array',
                'ids.*' => 'required|integer|exists:users,id',
            ]);

            $ids = $request->input('ids');

            // Prevent deleting current user
            if ($request_user = $request->user()) {
                if (in_array($request_user->id, $ids)) {
                    return response()->json([
                        'message' => 'You cannot delete your own account.'
                    ], 403);
                }
            }

            User::whereIn('id', $ids)->delete();

            return response()->json([
                'message' => 'Users deleted successfully.'
            ], 200);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('Bulk delete users failure: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An unexpected error occurred. Please try again later.'
            ], 500);
        }
    }
}
