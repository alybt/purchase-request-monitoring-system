<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\DepartmentBudget;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DepartmentTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);
    }

    public function test_can_list_departments(): void
    {
        Department::create(['name' => 'IT Dept', 'code' => 'IT']);
        Department::create(['name' => 'HR Dept', 'code' => 'HR']);

        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/departments');

        $response->assertStatus(200);
        $response->assertJsonCount(2, 'departments');
    }

    public function test_can_filter_departments_by_fiscal_year_and_month(): void
    {
        $dept = Department::create(['name' => 'Monthly Dept', 'code' => 'MD']);
        DepartmentBudget::create([
            'department_id' => $dept->id,
            'fiscal_year' => 2026,
            'month' => 5,
            'allocated_amount' => 10000,
            'reserved_amount' => 0,
            'spent_amount' => 0,
        ]);
        DepartmentBudget::create([
            'department_id' => $dept->id,
            'fiscal_year' => 2026,
            'month' => 6,
            'allocated_amount' => 5000,
            'reserved_amount' => 0,
            'spent_amount' => 0,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/departments?fiscal_year=2026&month=6');

        $response->assertStatus(200);
        $response->assertJsonPath('departments.0.budget_allocation', 1250);
        $response->assertJsonPath('month', 6);
    }

    public function test_can_create_department(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/departments', [
            'name' => 'Finance',
            'code' => 'FIN',
            'description' => 'Finance Department',
        ]);

        $response->assertStatus(201);
        $response->assertJsonFragment(['name' => 'Finance', 'code' => 'FIN']);
        $this->assertDatabaseHas('departments', ['code' => 'FIN']);
    }

    public function test_can_update_department(): void
    {
        $dept = Department::create(['name' => 'Old Dept', 'code' => 'OLD']);

        $response = $this->actingAs($this->admin, 'sanctum')->putJson('/api/departments/' . $dept->id, [
            'name' => 'Updated Dept',
            'code' => 'UPD',
        ]);

        $response->assertStatus(200);
        $response->assertJsonFragment(['name' => 'Updated Dept', 'code' => 'UPD']);
        $this->assertDatabaseHas('departments', ['id' => $dept->id, 'code' => 'UPD']);
    }

    public function test_can_delete_department(): void
    {
        $dept = Department::create(['name' => 'To Delete', 'code' => 'DEL']);

        $response = $this->actingAs($this->admin, 'sanctum')->deleteJson('/api/departments/' . $dept->id);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('departments', ['id' => $dept->id]);
    }

    public function test_can_bulk_delete_departments(): void
    {
        $d1 = Department::create(['name' => 'D1', 'code' => 'D1']);
        $d2 = Department::create(['name' => 'D2', 'code' => 'D2']);

        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/departments/bulk-delete', [
            'ids' => [$d1->id, $d2->id]
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('departments', ['id' => $d1->id]);
        $this->assertDatabaseMissing('departments', ['id' => $d2->id]);
    }

    public function test_can_delete_department_budget(): void
    {
        $dept = Department::create(['name' => 'Dept Budget', 'code' => 'DB']);
        DepartmentBudget::create([
            'department_id' => $dept->id,
            'fiscal_year' => 2026,
            'month' => 5,
            'allocated_amount' => 10000,
            'reserved_amount' => 0,
            'spent_amount' => 0,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')->deleteJson("/api/departments/{$dept->id}/budget", [
            'fiscal_year' => 2026,
            'month' => 5,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('department_budgets', ['department_id' => $dept->id, 'month' => 5]);
    }

    public function test_can_bulk_delete_department_budgets(): void
    {
        $d1 = Department::create(['name' => 'D1', 'code' => 'D1']);
        $d2 = Department::create(['name' => 'D2', 'code' => 'D2']);

        DepartmentBudget::create([
            'department_id' => $d1->id,
            'fiscal_year' => 2026,
            'month' => 6,
            'allocated_amount' => 10000,
        ]);
        DepartmentBudget::create([
            'department_id' => $d2->id,
            'fiscal_year' => 2026,
            'month' => 6,
            'allocated_amount' => 20000,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/departments/budget/bulk-delete', [
            'ids' => [$d1->id, $d2->id],
            'fiscal_year' => 2026,
            'month' => 6,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('department_budgets', ['department_id' => $d1->id, 'month' => 6]);
        $this->assertDatabaseMissing('department_budgets', ['department_id' => $d2->id, 'month' => 6]);
    }
}
