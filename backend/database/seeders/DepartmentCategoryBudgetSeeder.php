<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\DepartmentCategoryBudget;
use App\Models\DepartmentBudget;
use App\Models\Category;

class DepartmentCategoryBudgetSeeder extends Seeder
{
    public function run(): void
    {
        $departmentBudgets = DepartmentBudget::where('fiscal_year', 2026)->get();
        
        foreach ($departmentBudgets as $deptBudget) {
            $categoryAllocations = $this->getCategoryAllocations($deptBudget->department->code, $deptBudget->allocated_amount);
            
            foreach ($categoryAllocations as $categoryCode => $amount) {
                $category = Category::where('code', $categoryCode)->first();
                
                DepartmentCategoryBudget::create([
                    'department_budget_id' => $deptBudget->id,
                    'category_id' => $category->id,
                    'allocated_amount' => $amount,
                    'reserved_amount' => 0.00,
                    'spent_amount' => 0.00,
                ]);
            }
        }
    }

    private function getCategoryAllocations($deptCode, $totalBudget): array
    {
        $allocations = [
            'IT' => [
                'ITE' => 1200000.00,  // IT Equipment: ₱1,200,000
                'SL' => 500000.00,    // Software Licenses: ₱500,000
                'OS' => 300000.00,    // Office Supplies: ₱300,000
            ],
            'HR' => [
                'TD' => 400000.00,    // Training & Development: ₱400,000
                'OS' => 300000.00,    // Office Supplies: ₱300,000
                'TT' => 300000.00,    // Travel & Transportation: ₱300,000
            ],
            'FIN' => [
                'SL' => 500000.00,    // Software Licenses: ₱500,000
                'OS' => 400000.00,    // Office Supplies: ₱400,000
                'MR' => 600000.00,    // Maintenance & Repairs: ₱600,000
            ],
            'OPS' => [
                'FF' => 1000000.00,   // Furniture & Fixtures: ₱1,000,000
                'MR' => 1000000.00,   // Maintenance & Repairs: ₱1,000,000
                'OS' => 500000.00,    // Office Supplies: ₱500,000
                'TT' => 500000.00,    // Travel & Transportation: ₱500,000
            ],
            'MKT' => [
                'MA' => 1500000.00,   // Marketing & Advertising: ₱1,500,000
                'TT' => 500000.00,    // Travel & Transportation: ₱500,000
                'OS' => 500000.00,    // Office Supplies: ₱500,000
            ],
        ];

        return $allocations[$deptCode] ?? [];
    }
}
