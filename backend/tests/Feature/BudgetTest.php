<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Department;
use App\Models\DepartmentBudget;
use App\Models\DepartmentCategoryBudget;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BudgetTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Department $department;
    protected Category $category;
    protected DepartmentBudget $deptBudget;

    protected function setUp(): void
    {
        parent::setUp();
        $this->department = Department::create(['name' => 'IT', 'code' => 'IT']);
        $this->category = Category::create(['name' => 'Hardware', 'code' => 'HW']);
        $this->user = User::factory()->create([
            'role' => 'department_head',
            'status' => 'active',
            'department_id' => $this->department->id,
        ]);

        $this->deptBudget = DepartmentBudget::create([
            'department_id' => $this->department->id,
            'fiscal_year' => now()->year,
            'allocated_amount' => 100000.00,
            'reserved_amount' => 10000.00,
            'spent_amount' => 20000.00,
        ]);

        DepartmentCategoryBudget::create([
            'department_budget_id' => $this->deptBudget->id,
            'category_id' => $this->category->id,
            'allocated_amount' => 50000.00,
            'reserved_amount' => 5000.00,
            'spent_amount' => 10000.00,
        ]);
    }

    public function test_can_get_my_department_budget(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')->getJson('/api/budget/my-department');

        $response->assertStatus(200);
        $response->assertJsonPath('department_budget.id', $this->deptBudget->id);
        $response->assertJsonPath('department_budget.allocated', 100000);
        $response->assertJsonCount(1, 'category_budgets');
        $response->assertJsonPath('category_budgets.0.allocated', 50000);
    }

    public function test_can_get_category_budget(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')->getJson('/api/budget/category/' . $this->category->id);

        $response->assertStatus(200);
        $response->assertJsonPath('category_budget.category_id', $this->category->id);
        $response->assertJsonPath('category_budget.allocated', 50000);
    }
}
