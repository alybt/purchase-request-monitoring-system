<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class AuthTest extends TestCase
{
    /**
     * A basic feature test example.
     */
    use RefreshDatabase;
    public function test_example(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }

    public function test_user_login_with_correct_credentials(): void {
        $user = \App\Models\User::factory()->create([
            'email' => 'john@example.com',
            'password' => bcrypt('securepassword123'),
        ]);
        $response = $this->postJson('/api/login',[
            'email' => 'john@example.com',
            'password' => 'securepassword123',
        ]);
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'token',
            'user',
            'message'
        ]);
    }

    public function test_user_login_with_wrong_password(): void {
        $user = \App\Models\User::factory()->create([
            'email' => 'john@example.com',
            'password' => bcrypt('securepassword123'),
        ]);
        $response = $this->postJson('/api/login',[
            'email' => 'john@example.com',
            'password' => 'wrongpassword',
        ]);
        $response->assertStatus(401);
        $response->assertJsonStructure([
            'message'
        ]);
    }

    public function test_user_login_with_wrong_email(): void {
        $user = \App\Models\User::factory()->create([
            'email' => 'john@example.com',
            'password' => bcrypt('securepassword123'),
        ]);
        $response = $this->postJson('/api/login',[
            'email' => 'wrong@example.com',
            'password' => 'securepassword123',
        ]);
        $response->assertStatus(401);
        $response->assertJsonStructure([
            'message'
        ]);
    }

    public function test_user_login_with_missing_email(): void {
        $user = \App\Models\User::factory()->create([
            'email' => 'john@example.com',
            'password' => bcrypt('securepassword123'),
        ]);
        $response = $this->postJson('/api/login',[
            'password' => 'securepassword123',
        ]);
        $response->assertStatus(422);
        $response->assertJsonStructure([
            'message'
        ]);
    }

    public function test_user_login_with_missing_password(): void {
        $user = \App\Models\User::factory()->create([
            'email' => 'john@example.com',
            'password' => bcrypt('securepassword123'),
        ]);
        $response = $this->postJson('/api/login',[
            'email' => 'john@example.com',
        ]);
        $response->assertStatus(422);
        $response->assertJsonStructure([
            'message'
        ]); 
    }

    public function test_user_login_with_inactive_status_denied(): void {
        $user = \App\Models\User::factory()->create([
            'email' => 'inactive@example.com',
            'password' => bcrypt('securepassword123'),
            'status' => 'suspended',
        ]);
        $response = $this->postJson('/api/login',[
            'email' => 'inactive@example.com',
            'password' => 'securepassword123',
        ]);
        $response->assertStatus(403);
        $response->assertJsonFragment([
            'message' => 'Your account is not active.'
        ]);
    }

    public function test_user_login_response_contains_expected_fields(): void {
        $dept = \App\Models\Department::create([
            'name' => 'IT',
            'code' => 'IT',
        ]);
        $user = \App\Models\User::factory()->create([
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'testuser@example.com',
            'password' => bcrypt('securepassword123'),
            'role' => 'admin',
            'status' => 'active',
            'department_id' => $dept->id,
        ]);
        $response = $this->postJson('/api/login',[
            'email' => 'testuser@example.com',
            'password' => 'securepassword123',
        ]);
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'token',
            'user' => [
                'id',
                'first_name',
                'middle_name',
                'last_name',
                'email',
                'role',
                'status',
                'department',
            ],
            'message'
        ]);
    }

    public function test_user_can_get_current_user_profile(): void {
        $dept = \App\Models\Department::create([
            'name' => 'IT',
            'code' => 'IT',
        ]);
        $user = \App\Models\User::factory()->create([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
            'role' => 'admin',
            'status' => 'active',
            'department_id' => $dept->id,
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/me');

        $response->assertStatus(200);
        $response->assertJson([
            'user' => [
                'id' => $user->id,
                'first_name' => 'John',
                'middle_name' => $user->middle_name,
                'last_name' => 'Doe',
                'email' => 'john@example.com',
                'role' => 'admin',
                'status' => 'active',
            ]
        ]);
    }

    public function test_user_cannot_get_current_user_profile_unauthenticated(): void {
        $response = $this->getJson('/api/me');
        $response->assertStatus(401);
    }

    public function test_user_can_logout(): void {
        $user = \App\Models\User::factory()->create([
            'email' => 'john@example.com',
            'status' => 'active',
        ]);

        // Generate a token
        $token = $user->createToken('test_token')->plainTextToken;

        // Perform request with the token in Authorization header
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/logout');

        $response->assertStatus(200);
        $response->assertJson([
            'message' => 'Logged out successfully.'
        ]);

        // Assert that the token was deleted/revoked
        $this->assertCount(0, $user->tokens);
    }

    public function test_user_cannot_logout_unauthenticated(): void {
        $response = $this->postJson('/api/logout');
        $response->assertStatus(401);
    }

    public function test_connection_endpoint(): void {
        $response = $this->getJson('/api/test-connection');
        $response->assertStatus(200);
        $response->assertJson([
            'status'  => 'Success',
            'message' => 'Next.js and Laravel are officially talking!'
        ]);
    }

    public function test_user_can_change_password(): void {
        $user = \App\Models\User::factory()->create([
            'password' => bcrypt('oldpassword123'),
            'must_change_password' => true,
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/change-password', [
            'current_password' => 'oldpassword123',
            'new_password' => 'newpassword456',
            'new_password_confirmation' => 'newpassword456',
        ]);

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'message' => 'Password changed successfully.'
        ]);
        $this->assertFalse((bool)$user->fresh()->must_change_password);
    }
}

