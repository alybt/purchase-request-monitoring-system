<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CompanyBudget;

class CompanyBudgetSeeder extends Seeder
{
    public function run(): void
    {
        // Set company budget for current fiscal year
        CompanyBudget::create([
            'fiscal_year' => 2026,
            'total_budget' => 10000000.00, // ₱10,000,000
            'allocated_amount' => 0.00,
        ]);
    }
}
