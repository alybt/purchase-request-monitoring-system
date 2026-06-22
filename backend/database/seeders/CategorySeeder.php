<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Office Supplies',
                'code' => 'OS',
                'description' => 'General office supplies including paper, pens, folders, and consumables.',
            ],
            [
                'name' => 'IT Equipment',
                'code' => 'ITE',
                'description' => 'Computers, laptops, servers, networking equipment, and peripherals.',
            ],
            [
                'name' => 'Software Licenses',
                'code' => 'SL',
                'description' => 'Software subscriptions, licenses, and maintenance agreements.',
            ],
            [
                'name' => 'Maintenance & Repairs',
                'code' => 'MR',
                'description' => 'Equipment maintenance, repairs, and service contracts.',
            ],
            [
                'name' => 'Training & Development',
                'code' => 'TD',
                'description' => 'Employee training programs, workshops, and professional development.',
            ],
            [
                'name' => 'Marketing & Advertising',
                'code' => 'MA',
                'description' => 'Marketing campaigns, advertising materials, and promotional items.',
            ],
            [
                'name' => 'Furniture & Fixtures',
                'code' => 'FF',
                'description' => 'Office furniture, fixtures, and equipment.',
            ],
            [
                'name' => 'Travel & Transportation',
                'code' => 'TT',
                'description' => 'Business travel, transportation, and accommodation expenses.',
            ],
            [
                'name' => 'Miscellaneous',
                'code' => 'MSC',
                'description' => 'Other miscellaneous expenses not covered by specific categories.',
            ],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }
    }
}
