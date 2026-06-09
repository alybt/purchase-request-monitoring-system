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
        $user = \App\Models\User::factory()->create([
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'testuser@example.com',
            'password' => bcrypt('securepassword123'),
            'role' => 'admin',
            'status' => 'active',
            'department' => 'IT',
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
}

