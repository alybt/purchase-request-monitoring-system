<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\DepartmentBudget;
use App\Models\Department;
use App\Models\CompanyBudget;

class DepartmentBudgetSeeder extends Seeder
{
    public function run(): void
    {
        $companyBudget = CompanyBudget::where('fiscal_year', 2026)->first();
        
        $allocations = [
            'IT' => 2000000.00,   // ₱2,000,000 (20%)
            'HR' => 1000000.00,   // ₱1,000,000 (10%)
            'FIN' => 1500000.00,  // ₱1,500,000 (15%)
            'OPS' => 3000000.00,  // ₱3,000,000 (30%)
            'MKT' => 2500000.00,  // ₱2,500,000 (25%)
        ];

        foreach ($allocations as $code => $amount) {
            $department = Department::where('code', $code)->first();
            
            DepartmentBudget::create([
                'department_id' => $department->id,
                'fiscal_year' => 2026,
                'allocated_amount' => $amount,
                'reserved_amount' => 0.00,
                'spent_amount' => 0.00,
            ]);

            // Update department allocation percentage
            $percentage = ($amount / $companyBudget->total_budget) * 100;
            $department->budget_allocation = $amount;
            $department->allocation_percentage = $percentage;
            $department->save();
        }

        // Update company budget allocated amount
        $companyBudget->allocated_amount = array_sum($allocations);
        $companyBudget->save();
    }
}
