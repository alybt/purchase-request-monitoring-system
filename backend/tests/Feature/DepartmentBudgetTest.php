<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\DepartmentBudget;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DepartmentBudgetTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected Department $department;

    protected function setUp(): void
    {
        parent::setUp();

        $this->department = Department::create([
            'name' => 'Engineering',
            'code' => 'ENG',
            'description' => 'Software engineering department'
        ]);

        $this->admin = User::factory()->create([
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => 'admin@example.com',
            'role' => 'admin',
            'status' => 'active',
            'department_id' => $this->department->id,
        ]);
    }

    public function test_admin_can_allocate_and_update_monthly_budget(): void
    {
        // 1. Allocate budget for Year 2026, Month 6
        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/departments/{$this->department->id}/budget", [
                'allocated_amount' => 150000.00,
                'fiscal_year' => 2026,
                'month' => 6,
            ]);

        $response->assertStatus(200);
        $this->assertEquals(150000.00, $response->json('budget.allocated'));
        $this->assertEquals(6, $response->json('budget.month'));
        $this->assertEquals(2026, $response->json('budget.fiscal_year'));

        $this->assertDatabaseHas('department_budgets', [
            'department_id' => $this->department->id,
            'fiscal_year' => 2026,
            'month' => 6,
            'allocated_amount' => 150000.00,
        ]);
    }

    public function test_can_retrieve_budget_summary(): void
    {
        // Allocate budget for Month 1 and Month 2
        DepartmentBudget::create([
            'department_id' => $this->department->id,
            'fiscal_year' => 2026,
            'month' => 1,
            'allocated_amount' => 100000.00,
            'reserved_amount' => 10000.00,
            'spent_amount' => 20000.00,
        ]);

        DepartmentBudget::create([
            'department_id' => $this->department->id,
            'fiscal_year' => 2026,
            'month' => 2,
            'allocated_amount' => 120000.00,
            'reserved_amount' => 15000.00,
            'spent_amount' => 30000.00,
        ]);

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/departments/budget-summary?fiscal_year=2026');

        $response->assertStatus(200);
        $this->assertEquals(220000.00, $response->json('total_allocated'));
        $this->assertEquals(25000.00, $response->json('total_reserved'));
        $this->assertEquals(50000.00, $response->json('total_spent'));
        $this->assertEquals(145000.00, $response->json('total_available'));
    }

    public function test_can_retrieve_detailed_budget_calculations(): void
    {
        // Seed months 1 through 12 for the year 2026
        // Month 1 to 12 each gets 10,000 allocation
        for ($m = 1; $m <= 12; $m++) {
            DepartmentBudget::create([
                'department_id' => $this->department->id,
                'fiscal_year' => 2026,
                'month' => $m,
                'allocated_amount' => 10000.00,
                'reserved_amount' => 1000.00,
                'spent_amount' => 2000.00,
            ]);
        }

        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/departments/{$this->department->id}/budget-calculations?fiscal_year=2026");

        $response->assertStatus(200);

        // 1. For Year: total allocated should be 120,000 (12 * 10,000)
        $this->assertEquals(120000.00, $response->json('calculations.for_year.allocated'));
        $this->assertEquals(12000.00, $response->json('calculations.for_year.reserved'));
        $this->assertEquals(24000.00, $response->json('calculations.for_year.spent'));
        $this->assertEquals(84000.00, $response->json('calculations.for_year.available'));

        // 2. By Quarter calculations
        // Q1 (months 1-3) should be 30,000
        $this->assertEquals(30000.00, $response->json('calculations.quarters.q1_standard.allocated'));
        // Q1 user range (months 1-4) should be 40,000
        $this->assertEquals(40000.00, $response->json('calculations.quarters.q1_user.allocated'));
        // Q2 user range (months 4-6) should be 30,000
        $this->assertEquals(30000.00, $response->json('calculations.quarters.q2_user.allocated'));
        // Q3 user range (months 7-9) should be 30,000
        $this->assertEquals(30000.00, $response->json('calculations.quarters.q3_user.allocated'));
        // Q4 user range (months 10-12) should be 30,000
        $this->assertEquals(30000.00, $response->json('calculations.quarters.q4_user.allocated'));

        // 3. Last 12 months rolling calculations (based on current date/month)
        // Since we populated all 12 months of 2026, the rolling 12 months sum should count the relevant months.
        $response->assertJsonStructure([
            'calculations' => [
                'last_12_months' => [
                    'allocated',
                    'reserved',
                    'spent',
                    'available',
                ]
            ]
        ]);
    }

    public function test_can_retrieve_monthly_budget_summary_and_breakdown(): void
    {
        DepartmentBudget::create([
            'department_id' => $this->department->id,
            'fiscal_year' => 2026,
            'month' => 5,
            'allocated_amount' => 50000.00,
            'reserved_amount' => 5000.00,
            'spent_amount' => 10000.00,
        ]);

        DepartmentBudget::create([
            'department_id' => $this->department->id,
            'fiscal_year' => 2026,
            'month' => 6,
            'allocated_amount' => 80000.00,
            'reserved_amount' => 8000.00,
            'spent_amount' => 20000.00,
        ]);

        // 1. Check with month=6 filter
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/departments/budget-summary?fiscal_year=2026&month=6');

        $response->assertStatus(200);
        $this->assertEquals(6, $response->json('month'));
        $this->assertEquals(80000.00, $response->json('total_allocated'));
        $this->assertEquals(8000.00, $response->json('total_reserved'));
        $this->assertEquals(20000.00, $response->json('total_spent'));
        $this->assertEquals(52000.00, $response->json('total_available'));

        // 2. Check monthly_breakdown structure inside department_summaries
        $summaries = $response->json('department_summaries');
        $this->assertCount(1, $summaries);
        $this->assertCount(12, $summaries[0]['monthly_breakdown']);
        
        $month5Breakdown = collect($summaries[0]['monthly_breakdown'])->firstWhere('month', 5);
        $this->assertEquals(50000.00, $month5Breakdown['allocated']);

        $month6Breakdown = collect($summaries[0]['monthly_breakdown'])->firstWhere('month', 6);
        $this->assertEquals(80000.00, $month6Breakdown['allocated']);
    }
}
