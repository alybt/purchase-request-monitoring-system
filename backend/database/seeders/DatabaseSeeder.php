<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            DepartmentSeeder::class,
            CategorySeeder::class,
            UserSeeder::class,
            CompanyBudgetSeeder::class,
            DepartmentBudgetSeeder::class,
            DepartmentCategoryBudgetSeeder::class,
            PurchaseRequestSeeder::class,
        ]);
    }
}