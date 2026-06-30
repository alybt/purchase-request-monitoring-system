<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        try {
            // 1. Validate incoming request
            $fields = $request->validate([
                'email'    => 'required|string|email',
                'password' => 'required|string',
            ]);
            // 2. Fetch user
            $user = User::where('email', $fields['email'])->first();
            // 3. Verify user exists and check password
            if (!$user || !Hash::check($fields['password'], $user->password)) {
                return response()->json([
                    'message' => 'Invalid credentials.'
                ], 401);
            }

            // Check if user account is active
            if ($user->status !== 'active') {
                return response()->json([
                    'message' => 'Your account is not active.'
                ], 403);
            }

            // 4. Create new token
            $token = $user->createToken('auth_token')->plainTextToken;
            // 5. Return response — include must_change_password so the frontend can redirect
            return response()->json([
                'message' => 'Logged in successfully.',
                'user'    => [
                    'id'                   => $user->id,
                    'first_name'           => $user->first_name,
                    'middle_name'          => $user->middle_name,
                    'last_name'            => $user->last_name,
                    'email'                => $user->email,
                    'role'                 => $user->role,
                    'status'               => $user->status,
                    'department'           => $user->department,
                    'must_change_password' => (bool) $user->must_change_password,
                ],
                'token' => $token
            ], 200);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('Login endpoint failure: ' . $e->getMessage(), [
                'email' => $request->input('email'),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'message' => 'An unexpected error occurred. Please try again later.'
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        try {
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'message' => 'Logged out successfully.'
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Logout endpoint failure: ' . $e->getMessage(), [
                'user_id' => $request->user()?->id,
                'trace'   => $e->getTraceAsString(),
            ]);
            return response()->json([
                'message' => 'An unexpected error occurred. Please try again later.'
            ], 500);
        }
    }

    public function me(Request $request)
    {
        try {
            $user = $request->user();

            return response()->json([
                'user' => [
                    'id'                   => $user->id,
                    'first_name'           => $user->first_name,
                    'middle_name'          => $user->middle_name,
                    'last_name'            => $user->last_name,
                    'email'                => $user->email,
                    'role'                 => $user->role,
                    'status'               => $user->status,
                    'department'           => $user->department,
                    'must_change_password' => (bool) $user->must_change_password,
                ]
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Get current user endpoint failure: ' . $e->getMessage(), [
                'user_id' => $request->user()?->id,
                'trace'   => $e->getTraceAsString(),
            ]);
            return response()->json([
                'message' => 'An unexpected error occurred. Please try again later.'
            ], 500);
        }
    }

    /**
     * Change password — required on first login when must_change_password == true.
     * Also available for self-service password changes at any time.
     */
    public function changePassword(Request $request)
    {
        try {
            $request->validate([
                'current_password' => 'required|string',
                'new_password'     => [
                    'required',
                    'string',
                    'min:8',
                    'confirmed',         // expects new_password_confirmation field
                    'regex:/[A-Za-z]/',  // at least one letter
                    'regex:/[0-9]/',     // at least one number
                ],
            ]);

            $user = $request->user();

            // Verify current password
            if (!Hash::check($request->input('current_password'), $user->password)) {
                return response()->json([
                    'message' => 'Current password is incorrect.',
                    'errors'  => ['current_password' => ['Current password is incorrect.']],
                ], 422);
            }

            // Prevent reuse of the same password
            if (Hash::check($request->input('new_password'), $user->password)) {
                return response()->json([
                    'message' => 'New password must differ from the current password.',
                    'errors'  => ['new_password' => ['New password must differ from the current password.']],
                ], 422);
            }

            $user->update([
                'password'             => $request->input('new_password'), // cast handles hashing
                'must_change_password' => false,
                'password_changed_at'  => now(),
            ]);

            return response()->json([
                'message' => 'Password changed successfully.',
                'user'    => [
                    'id'                   => $user->id,
                    'first_name'           => $user->first_name,
                    'last_name'            => $user->last_name,
                    'email'                => $user->email,
                    'role'                 => $user->role,
                    'status'               => $user->status,
                    'department'           => $user->department,
                    'must_change_password' => false,
                ],
            ], 200);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('Change password failure: ' . $e->getMessage(), [
                'user_id' => $request->user()?->id,
                'trace'   => $e->getTraceAsString(),
            ]);
            return response()->json([
                'message' => 'An unexpected error occurred. Please try again later.'
            ], 500);
        }
    }
}
