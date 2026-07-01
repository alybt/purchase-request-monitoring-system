<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Department;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            [
                'name' => 'Information Technology',
                'code' => 'IT',
                'description' => 'Manages IT infrastructure, software development, and technical support.',
                'status' => 'active',
                'budget_allocation' => 0.00,
                'allocation_percentage' => 0.00,
            ],
            [
                'name' => 'Human Resources',
                'code' => 'HR',
                'description' => 'Handles recruitment, employee relations, benefits, and training.',
                'status' => 'active',
                'budget_allocation' => 0.00,
                'allocation_percentage' => 0.00,
            ],
            [
                'name' => 'Finance',
                'code' => 'FIN',
                'description' => 'Manages financial planning, accounting, and budgeting.',
                'status' => 'active',
                'budget_allocation' => 0.00,
                'allocation_percentage' => 0.00,
            ],
            [
                'name' => 'Operations',
                'code' => 'OPS',
                'description' => 'Oversees daily operations, logistics, and supply chain management.',
                'status' => 'active',
                'budget_allocation' => 0.00,
                'allocation_percentage' => 0.00,
            ],
            [
                'name' => 'Marketing',
                'code' => 'MKT',
                'description' => 'Handles marketing campaigns, advertising, and brand management.',
                'status' => 'active',
                'budget_allocation' => 0.00,
                'allocation_percentage' => 0.00,
            ],
        ];

        foreach ($departments as $department) {
            Department::create($department);
        }
    }
}
