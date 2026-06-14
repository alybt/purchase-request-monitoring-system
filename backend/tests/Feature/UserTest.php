<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $employee1;
    protected User $employee2;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed users for testing
        $this->admin = User::factory()->create([
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => 'admin@example.com',
            'role' => 'admin',
            'status' => 'active',
            'department' => 'IT',
        ]);

        $this->employee1 = User::factory()->create([
            'first_name' => 'John',
            'middle_name' => 'M',
            'last_name' => 'Doe',
            'email' => 'john.doe@example.com',
            'role' => 'employee',
            'status' => 'active',
            'department' => 'HR',
        ]);

        $this->employee2 = User::factory()->create([
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'email' => 'jane.smith@example.com',
            'role' => 'approver',
            'status' => 'suspended',
            'department' => 'Finance',
        ]);
    }

    public function test_authenticated_user_can_list_users(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/users');

        $response->assertStatus(200);
        $response->assertJsonCount(3, 'users');
        $response->assertJsonStructure([
            'users' => [
                '*' => [
                    'id',
                    'first_name',
                    'middle_name',
                    'last_name',
                    'email',
                    'role',
                    'status',
                    'department',
                    'created_at',
                    'updated_at',
                ]
            ]
        ]);
    }

    public function test_unauthenticated_user_cannot_list_users(): void
    {
        $response = $this->getJson('/api/users');
        $response->assertStatus(401);
    }

    public function test_list_users_with_search(): void
    {
        // Search by first name
        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/users?search=John');
        $response->assertStatus(200);
        $response->assertJsonCount(1, 'users');
        $response->assertJsonFragment(['email' => 'john.doe@example.com']);

        // Search by last name
        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/users?search=Smith');
        $response->assertStatus(200);
        $response->assertJsonCount(1, 'users');
        $response->assertJsonFragment(['email' => 'jane.smith@example.com']);

        // Search by email
        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/users?search=admin@example.com');
        $response->assertStatus(200);
        $response->assertJsonCount(1, 'users');
        $response->assertJsonFragment(['email' => 'admin@example.com']);
    }

    public function test_list_users_with_filters(): void
    {
        // Filter by role
        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/users?role=approver');
        $response->assertStatus(200);
        $response->assertJsonCount(1, 'users');
        $response->assertJsonFragment(['email' => 'jane.smith@example.com']);

        // Filter by status
        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/users?status=suspended');
        $response->assertStatus(200);
        $response->assertJsonCount(1, 'users');
        $response->assertJsonFragment(['email' => 'jane.smith@example.com']);

        // Filter by department
        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/users?department=HR');
        $response->assertStatus(200);
        $response->assertJsonCount(1, 'users');
        $response->assertJsonFragment(['email' => 'john.doe@example.com']);
    }

    public function test_create_user_successfully(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/users', [
            'first_name' => 'Alice',
            'last_name' => 'Jones',
            'email' => 'alice.jones@example.com',
            'password' => 'supersecretpassword123',
            'role' => 'employee',
            'status' => 'active',
            'department' => 'Operations',
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'message',
            'user' => [
                'id',
                'first_name',
                'last_name',
                'email',
                'role',
                'status',
                'department',
            ]
        ]);

        $this->assertDatabaseHas('users', [
            'email' => 'alice.jones@example.com',
            'first_name' => 'Alice',
            'last_name' => 'Jones',
        ]);
    }

    public function test_create_user_validation(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/users', [
            'first_name' => '',
            'last_name' => '',
            'email' => 'not-an-email',
            'password' => 'short',
            'role' => 'invalid-role',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['first_name', 'last_name', 'email', 'password', 'role']);
    }

    public function test_get_single_user(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/users/' . $this->employee1->id);

        $response->assertStatus(200);
        $response->assertJsonPath('user.email', 'john.doe@example.com');
    }

    public function test_get_single_user_not_found(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/users/9999');
        $response->assertStatus(404);
    }

    public function test_update_user(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->putJson('/api/users/' . $this->employee1->id, [
            'first_name' => 'Johnny',
            'last_name' => 'Doe Updated',
            'email' => 'johnny.updated@example.com',
            'role' => 'approver',
            'status' => 'suspended',
            'department' => 'Marketing',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('user.first_name', 'Johnny');
        $response->assertJsonPath('user.email', 'johnny.updated@example.com');

        $this->assertDatabaseHas('users', [
            'id' => $this->employee1->id,
            'first_name' => 'Johnny',
            'last_name' => 'Doe Updated',
            'email' => 'johnny.updated@example.com',
        ]);
    }

    public function test_delete_user(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->deleteJson('/api/users/' . $this->employee1->id);

        $response->assertStatus(200);
        $response->assertJsonFragment(['message' => 'User deleted successfully.']);

        $this->assertDatabaseMissing('users', [
            'id' => $this->employee1->id
        ]);
    }

    public function test_cannot_delete_self(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->deleteJson('/api/users/' . $this->admin->id);

        $response->assertStatus(403);
        $response->assertJsonFragment(['message' => 'You cannot delete your own account.']);
    }

    public function test_bulk_delete_users(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/users/bulk-delete', [
            'ids' => [$this->employee1->id, $this->employee2->id]
        ]);

        $response->assertStatus(200);
        $response->assertJsonFragment(['message' => 'Users deleted successfully.']);

        $this->assertDatabaseMissing('users', [
            'id' => $this->employee1->id
        ]);
        $this->assertDatabaseMissing('users', [
            'id' => $this->employee2->id
        ]);
    }

    public function test_bulk_delete_cannot_include_self(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/users/bulk-delete', [
            'ids' => [$this->employee1->id, $this->admin->id]
        ]);

        $response->assertStatus(403);
        $response->assertJsonFragment(['message' => 'You cannot delete your own account.']);

        // Assert no users were deleted because the request failed
        $this->assertDatabaseHas('users', [
            'id' => $this->employee1->id
        ]);
    }
}
