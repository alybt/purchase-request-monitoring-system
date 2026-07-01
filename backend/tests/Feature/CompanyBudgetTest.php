<?php

namespace Tests\Feature;

use App\Models\CompanyBudget;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CompanyBudgetTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);
    }

    public function test_can_list_company_budgets(): void
    {
        CompanyBudget::create(['fiscal_year' => 2026, 'total_budget' => 1000000]);

        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/company-budget');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'budgets');
    }

    public function test_can_get_single_company_budget(): void
    {
        CompanyBudget::create(['fiscal_year' => 2026, 'total_budget' => 1000000]);

        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/company-budget/2026');

        $response->assertStatus(200);
        $response->assertJsonPath('budget.fiscal_year', 2026);
    }

    public function test_can_upsert_company_budget(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/company-budget', [
            'fiscal_year' => 2026,
            'total_budget' => 5000000,
            'carry_forward' => 0
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('company_budgets', ['fiscal_year' => 2026, 'total_budget' => 5000000]);
    }

    public function test_can_delete_company_budget(): void
    {
        CompanyBudget::create(['fiscal_year' => 2026, 'total_budget' => 1000000]);

        $response = $this->actingAs($this->admin, 'sanctum')->deleteJson('/api/company-budget/2026');

        $response->assertStatus(200);
        $this->assertDatabaseMissing('company_budgets', ['fiscal_year' => 2026]);
    }
}
