<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CompanyBudget;

class CompanyBudgetSeeder extends Seeder
{
    public function run(): void
    {
        CompanyBudget::firstOrCreate(['fiscal_year' => 2024], [
            'total_budget' => 8000000.00,
            'allocated_amount' => 8000000.00,
            'carry_forward' => 0.00,
        ]);

        CompanyBudget::firstOrCreate(['fiscal_year' => 2025], [
            'total_budget' => 9000000.00,
            'allocated_amount' => 9000000.00,
            'carry_forward' => 500000.00,
        ]);

        CompanyBudget::firstOrCreate(['fiscal_year' => 2026], [
            'total_budget' => 10000000.00,
            'allocated_amount' => 0.00,
            'carry_forward' => 0.00,
        ]);
    }
}
