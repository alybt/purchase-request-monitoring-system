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

        // 2. Seed Purchase Requests
        $pr1 = PurchaseRequest::create([
            'pr_number' => 'PR-2026-001',
            'user_id' => $employee1->id,
            'purpose_of_requests' => 'Office Laptop Upgrades',
            'total_estimated_cost' => 2500.00,
            'status' => 'Request',
        ]);

        $pr2 = PurchaseRequest::create([
            'pr_number' => 'PR-2026-002',
            'user_id' => $employee1->id,
            'purpose_of_requests' => 'Ergonomic Office Chairs',
            'total_estimated_cost' => 1200.00,
            'status' => 'Approve',
        ]);

        $pr3 = PurchaseRequest::create([
            'pr_number' => 'PR-2026-003',
            'user_id' => $employee2->id,
            'purpose_of_requests' => 'Recruitment Event Supplies',
            'total_estimated_cost' => 450.00,
            'status' => 'Released',
        ]);

        $pr4 = PurchaseRequest::create([
            'pr_number' => 'PR-2026-004',
            'user_id' => $employee2->id,
            'purpose_of_requests' => 'Conference Room TV',
            'total_estimated_cost' => 800.00,
            'status' => 'Received',
        ]);

        $pr5 = PurchaseRequest::create([
            'pr_number' => 'PR-2026-005',
            'user_id' => $employee1->id,
            'purpose_of_requests' => 'Software Licenses',
            'total_estimated_cost' => 1500.00,
            'status' => 'Request',
        ]);

        // 3. Seed Line Items for Purchase Requests
        PrLineItem::create([
            'pr_id' => $pr1->id,
            'item_name' => 'MacBook Pro 14"',
            'description' => 'M3, 16GB RAM, 512GB SSD',
            'quantity' => 1,
            'unit_price' => 2000.00,
            'total_price' => 2000.00,
            'vendor' => 'Apple Inc.',
        ]);
        PrLineItem::create([
            'pr_id' => $pr1->id,
            'item_name' => 'Dell Monitor 27"',
            'description' => '4K UHD USB-C Hub Monitor',
            'quantity' => 1,
            'unit_price' => 500.00,
            'total_price' => 500.00,
            'vendor' => 'Dell',
        ]);

        PrLineItem::create([
            'pr_id' => $pr2->id,
            'item_name' => 'Herman Miller Aeron Chair',
            'description' => 'Size B, Graphite, Fully Adjustable',
            'quantity' => 1,
            'unit_price' => 1200.00,
            'total_price' => 1200.00,
            'vendor' => 'Herman Miller Store',
        ]);

        PrLineItem::create([
            'pr_id' => $pr3->id,
            'item_name' => 'Custom Banner Printing',
            'description' => '8ft x 3ft Vinyl Banner with grommets',
            'quantity' => 2,
            'unit_price' => 100.00,
            'total_price' => 200.00,
            'vendor' => 'Vistaprint',
        ]);
        PrLineItem::create([
            'pr_id' => $pr3->id,
            'item_name' => 'Branded Pens (100 pack)',
            'description' => 'Black ink ballpoint with company logo',
            'quantity' => 5,
            'unit_price' => 50.00,
            'total_price' => 250.00,
            'vendor' => 'PromoStore',
        ]);

        PrLineItem::create([
            'pr_id' => $pr4->id,
            'item_name' => 'Sony 65" 4K Smart TV',
            'description' => 'KD-65X75K LED Google TV',
            'quantity' => 1,
            'unit_price' => 800.00,
            'total_price' => 800.00,
            'vendor' => 'Best Buy Business',
        ]);

        PrLineItem::create([
            'pr_id' => $pr5->id,
            'item_name' => 'Adobe Creative Cloud annual license',
            'description' => 'All apps team subscription',
            'quantity' => 2,
            'unit_price' => 750.00,
            'total_price' => 1500.00,
            'vendor' => 'Adobe Systems',
        ]);

        // 4. Seed Approval Forms
        ApprovalForm::create([
            'pr_id' => $pr2->id,
            'approver_id' => $approver->id,
            'status' => 'Approve',
            'comments' => 'Approved. Fully fits ergonomics program requirements.',
            'action_date' => now(),
        ]);

        ApprovalForm::create([
            'pr_id' => $pr3->id,
            'approver_id' => $approver->id,
            'status' => 'Approve',
            'comments' => 'Urgent marketing budget approved.',
            'action_date' => now()->subDays(2),
        ]);

        ApprovalForm::create([
            'pr_id' => $pr4->id,
            'approver_id' => $approver->id,
            'status' => 'Approve',
            'comments' => 'Approved for meeting room A.',
            'action_date' => now()->subDays(5),
        ]);
    }
}
