<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);
    }

    public function test_can_list_categories(): void
    {
        Category::create(['name' => 'IT Equipment', 'code' => 'IT-EQ', 'description' => 'Hardware']);
        Category::create(['name' => 'Office Supplies', 'code' => 'OFF-SUP', 'description' => 'Supplies']);

        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/categories');

        $response->assertStatus(200);
        $response->assertJsonCount(2, 'categories');
    }

    public function test_can_create_category(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/categories', [
            'name' => 'Software Licenses',
            'code' => 'SW-LIC',
            'description' => 'Annual software subscriptions',
        ]);

        $response->assertStatus(201);
        $response->assertJsonFragment(['name' => 'Software Licenses', 'code' => 'SW-LIC']);
        $this->assertDatabaseHas('categories', ['code' => 'SW-LIC']);
    }

    public function test_can_update_category(): void
    {
        $category = Category::create(['name' => 'Old Name', 'code' => 'OLD', 'description' => 'Old desc']);

        $response = $this->actingAs($this->admin, 'sanctum')->putJson('/api/categories/' . $category->id, [
            'name' => 'New Name',
            'code' => 'NEW',
        ]);

        $response->assertStatus(200);
        $response->assertJsonFragment(['name' => 'New Name', 'code' => 'NEW']);
        $this->assertDatabaseHas('categories', ['id' => $category->id, 'code' => 'NEW']);
    }

    public function test_can_delete_category(): void
    {
        $category = Category::create(['name' => 'To Delete', 'code' => 'DEL']);

        $response = $this->actingAs($this->admin, 'sanctum')->deleteJson('/api/categories/' . $category->id);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    }

    public function test_can_bulk_delete_categories(): void
    {
        $c1 = Category::create(['name' => 'Cat 1', 'code' => 'C1']);
        $c2 = Category::create(['name' => 'Cat 2', 'code' => 'C2']);

        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/categories/bulk-delete', [
            'ids' => [$c1->id, $c2->id]
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('categories', ['id' => $c1->id]);
        $this->assertDatabaseMissing('categories', ['id' => $c2->id]);
    }
}
