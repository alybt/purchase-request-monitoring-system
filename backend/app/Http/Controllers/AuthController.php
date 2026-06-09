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
                'email' => 'required|string|email',
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
            // 4. Create new token
            $token = $user->createToken('auth_token')->plainTextToken;
            // 5. Return response
            return response()->json([
                'message' => 'Logged in successfully.',
                'user' => [
                    'id' => $user->id,
                    'name' => trim(
                        $user->first_name . ' ' .
                        $user->last_name
                    ),
                    'email' => $user->email,
                ],
                'token' => $token
            ], 200);
        } catch (ValidationException $e) {
            // Let Laravel handle validation exceptions normally so it returns 422
            throw $e;
        } catch (\Throwable $e) {
            // Log the actual error internally with context (but hide it from the user)
            Log::error('Login endpoint failure: ' . $e->getMessage(), [
                'email' => $request->input('email'),
                'trace' => $e->getTraceAsString(),
            ]);
            // Return a clean, secure error message to the client
            return response()->json([
                'message' => 'An unexpected error occurred. Please try again later.'
            ], 500);
        }
    }
}

