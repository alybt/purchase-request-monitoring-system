<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\PurchaseRequest;
use App\Models\PrLineItem;
use App\Models\ApprovalForm;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Users (Admin, Approver, Employees)
        $admin = User::create([
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'status' => 'active',
            'department' => 'IT',
        ]);

        $approver = User::create([
            'first_name' => 'Approver',
            'last_name' => 'User',
            'email' => 'approver@example.com',
            'password' => Hash::make('password'),
            'role' => 'approver',
            'status' => 'active',
            'department' => 'Finance',
        ]);

        $employee1 = User::create([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'employee@example.com',
            'password' => Hash::make('password'),
            'role' => 'employee',
            'status' => 'active',
            'department' => 'Operations',
        ]);

        $employee2 = User::create([
            'first_name' => 'Jane',
            'last_name' => 'Smith',
            'email' => 'jane@example.com',
            'password' => Hash::make('password'),
            'role' => 'employee',
            'status' => 'active',
            'department' => 'HR',
        ]);

        $employee3 = User::create([
            'first_name' => 'Bob',
            'last_name' => 'Johnson',
            'email' => 'bob@example.com',
            'password' => Hash::make('password'),
            'role' => 'employee',
            'status' => 'suspended',
            'department' => 'Sales',
        ]);
    }
}
