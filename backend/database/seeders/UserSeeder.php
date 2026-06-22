<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Department;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Create Admin
        $admin = User::create([
            'first_name' => 'System',
            'middle_name' => null,
            'last_name' => 'Administrator',
            'email' => 'admin@company.com',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'status' => 'active',
            'department_id' => null,
        ]);

        // Get departments
        $itDept = Department::where('code', 'IT')->first();
        $hrDept = Department::where('code', 'HR')->first();
        $finDept = Department::where('code', 'FIN')->first();
        $opsDept = Department::where('code', 'OPS')->first();
        $mktDept = Department::where('code', 'MKT')->first();

        // Create Department Heads
        $departmentHeads = [
            [
                'first_name' => 'Juan',
                'middle_name' => 'Santos',
                'last_name' => 'Reyes',
                'email' => 'juan.reyes@company.com',
                'password' => Hash::make('password123'),
                'role' => 'department_head',
                'status' => 'active',
                'department_id' => $itDept->id,
            ],
            [
                'first_name' => 'Maria',
                'middle_name' => 'Garcia',
                'last_name' => 'Santos',
                'email' => 'maria.santos@company.com',
                'password' => Hash::make('password123'),
                'role' => 'department_head',
                'status' => 'active',
                'department_id' => $hrDept->id,
            ],
            [
                'first_name' => 'Carlos',
                'middle_name' => 'Mendoza',
                'last_name' => 'Rodriguez',
                'email' => 'carlos.rodriguez@company.com',
                'password' => Hash::make('password123'),
                'role' => 'department_head',
                'status' => 'active',
                'department_id' => $finDept->id,
            ],
            [
                'first_name' => 'Ana',
                'middle_name' => 'Flores',
                'last_name' => 'Martinez',
                'email' => 'ana.martinez@company.com',
                'password' => Hash::make('password123'),
                'role' => 'department_head',
                'status' => 'active',
                'department_id' => $opsDept->id,
            ],
            [
                'first_name' => 'Pedro',
                'middle_name' => 'Castillo',
                'last_name' => 'Lopez',
                'email' => 'pedro.lopez@company.com',
                'password' => Hash::make('password123'),
                'role' => 'department_head',
                'status' => 'active',
                'department_id' => $mktDept->id,
            ],
        ];

        foreach ($departmentHeads as $deptHead) {
            User::create($deptHead);
        }
    }
}
