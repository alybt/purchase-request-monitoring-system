<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        // 1. Validate incoming request
        $fields = $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        // 2. Fetch user
        $user = User::where('email', $fields['email'])->first();

        // 3. Verify user exists and check password
        if (!$user || !Hash::check($fields['password'], $user->password)) {
            // Return a generic error to prevent user enumeration
            return response()->json([
                'message' => 'Invalid credentials.'
            ], 401);
        }

        // 4. Revoke previous tokens (optional: only if you want 1 session per user)
        // $user->tokens()->delete();

        // 5. Create new token
        $token = $user->createToken('auth_token')->plainTextToken;

        // 6. Return response
        return response()->json([
            'message' => 'Logged in successfully.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'token' => $token
        ], 200);
    }
}

