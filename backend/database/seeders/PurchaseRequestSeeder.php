<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use App\Models\PurchaseRequestStatusHistory;
use App\Models\User;
use App\Models\Department;
use App\Models\Category;
use Carbon\Carbon;

class PurchaseRequestSeeder extends Seeder
{
    public function run(): void
    {
        $itDeptHead = User::where('email', 'juan.reyes@company.com')->first();
        $admin = User::where('email', 'admin@company.com')->first();
        $itDept = Department::where('code', 'IT')->first();
        $itEquipment = Category::where('code', 'ITE')->first();

        // Create sample purchase requests
        $this->createApprovedPR($itDeptHead, $admin, $itDept, $itEquipment);
        $this->createPendingPR($itDeptHead, $itDept, $itEquipment);
        $this->createRejectedPR($itDeptHead, $admin, $itDept, $itEquipment);
        $this->createOrderedPR($itDeptHead, $admin, $itDept, $itEquipment);
    }

    private function createApprovedPR($requestedBy, $approvedBy, $department, $category)
    {
        $pr = PurchaseRequest::create([
            'pr_number' => $this->generatePRNumber(),
            'department_id' => $department->id,
            'category_id' => $category->id,
            'requested_by' => $requestedBy->id,
            'approved_by' => $approvedBy->id,
            'purpose' => 'Upgrade development workstations for the software engineering team to improve productivity and support new development tools.',
            'total_estimated_cost' => 450000.00,
            'status' => 'Approved',
            'remarks' => 'Approved as requested. Please ensure proper asset tagging upon receipt.',
            'submitted_at' => Carbon::now()->subDays(5),
            'approved_at' => Carbon::now()->subDays(3),
        ]);

        // Add line items
        $items = [
            [
                'item_name' => 'Dell Precision 5680 Workstation',
                'description' => 'Intel Core i9, 64GB RAM, 1TB SSD, NVIDIA RTX 4000',
                'quantity' => 5,
                'unit_price' => 75000.00,
                'total_price' => 375000.00,
                'vendor' => 'Dell Technologies',
            ],
            [
                'item_name' => 'Dell UltraSharp U2723QE Monitor',
                'description' => '27-inch 4K USB-C Hub Monitor',
                'quantity' => 5,
                'unit_price' => 15000.00,
                'total_price' => 75000.00,
                'vendor' => 'Dell Technologies',
            ],
        ];

        foreach ($items as $item) {
            PurchaseRequestItem::create(array_merge($item, ['purchase_request_id' => $pr->id]));
        }

        // Add status history
        PurchaseRequestStatusHistory::create([
            'purchase_request_id' => $pr->id,
            'from_status' => null,
            'to_status' => 'Draft',
            'changed_by' => $requestedBy->id,
            'remarks' => 'PR created',
            'created_at' => Carbon::now()->subDays(5),
        ]);

        PurchaseRequestStatusHistory::create([
            'purchase_request_id' => $pr->id,
            'from_status' => 'Draft',
            'to_status' => 'Submitted',
            'changed_by' => $requestedBy->id,
            'remarks' => 'Submitted for approval',
            'created_at' => Carbon::now()->subDays(5),
        ]);

        PurchaseRequestStatusHistory::create([
            'purchase_request_id' => $pr->id,
            'from_status' => 'Submitted',
            'to_status' => 'Approved',
            'changed_by' => $approvedBy->id,
            'remarks' => 'Approved as requested',
            'created_at' => Carbon::now()->subDays(3),
        ]);
    }

    private function createPendingPR($requestedBy, $department, $category)
    {
        $pr = PurchaseRequest::create([
            'pr_number' => $this->generatePRNumber(),
            'department_id' => $department->id,
            'category_id' => $category->id,
            'requested_by' => $requestedBy->id,
            'purpose' => 'Purchase additional laptops for new hires joining next month.',
            'total_estimated_cost' => 300000.00,
            'status' => 'Submitted',
            'submitted_at' => Carbon::now()->subDays(1),
        ]);

        $items = [
            [
                'item_name' => 'Dell Latitude 5540 Laptop',
                'description' => 'Intel Core i7, 16GB RAM, 512GB SSD',
                'quantity' => 4,
                'unit_price' => 75000.00,
                'total_price' => 300000.00,
                'vendor' => 'Dell Technologies',
            ],
        ];

        foreach ($items as $item) {
            PurchaseRequestItem::create(array_merge($item, ['purchase_request_id' => $pr->id]));
        }

        PurchaseRequestStatusHistory::create([
            'purchase_request_id' => $pr->id,
            'from_status' => null,
            'to_status' => 'Draft',
            'changed_by' => $requestedBy->id,
            'remarks' => 'PR created',
            'created_at' => Carbon::now()->subDays(1),
        ]);

        PurchaseRequestStatusHistory::create([
            'purchase_request_id' => $pr->id,
            'from_status' => 'Draft',
            'to_status' => 'Submitted',
            'changed_by' => $requestedBy->id,
            'remarks' => 'Submitted for approval',
            'created_at' => Carbon::now()->subDays(1),
        ]);
    }

    private function createRejectedPR($requestedBy, $approvedBy, $department, $category)
    {
        $pr = PurchaseRequest::create([
            'pr_number' => $this->generatePRNumber(),
            'department_id' => $department->id,
            'category_id' => $category->id,
            'requested_by' => $requestedBy->id,
            'purpose' => 'Purchase high-end gaming PCs for the office',
            'total_estimated_cost' => 500000.00,
            'status' => 'Rejected',
            'rejection_reason' => 'Request does not align with business requirements. Gaming PCs are not necessary for office operations.',
            'submitted_at' => Carbon::now()->subDays(10),
            'approved_at' => Carbon::now()->subDays(8),
        ]);

        $items = [
            [
                'item_name' => 'Custom Gaming PC',
                'description' => 'High-end gaming configuration',
                'quantity' => 2,
                'unit_price' => 250000.00,
                'total_price' => 500000.00,
                'vendor' => 'Local Builder',
            ],
        ];

        foreach ($items as $item) {
            PurchaseRequestItem::create(array_merge($item, ['purchase_request_id' => $pr->id]));
        }

        PurchaseRequestStatusHistory::create([
            'purchase_request_id' => $pr->id,
            'from_status' => null,
            'to_status' => 'Draft',
            'changed_by' => $requestedBy->id,
            'remarks' => 'PR created',
            'created_at' => Carbon::now()->subDays(10),
        ]);

        PurchaseRequestStatusHistory::create([
            'purchase_request_id' => $pr->id,
            'from_status' => 'Draft',
            'to_status' => 'Submitted',
            'changed_by' => $requestedBy->id,
            'remarks' => 'Submitted for approval',
            'created_at' => Carbon::now()->subDays(10),
        ]);

        PurchaseRequestStatusHistory::create([
            'purchase_request_id' => $pr->id,
            'from_status' => 'Submitted',
            'to_status' => 'Rejected',
            'changed_by' => $approvedBy->id,
            'remarks' => 'Request does not align with business requirements',
            'created_at' => Carbon::now()->subDays(8),
        ]);
    }

    private function createOrderedPR($requestedBy, $approvedBy, $department, $category)
    {
        $pr = PurchaseRequest::create([
            'pr_number' => $this->generatePRNumber(),
            'department_id' => $department->id,
            'category_id' => $category->id,
            'requested_by' => $requestedBy->id,
            'approved_by' => $approvedBy->id,
            'purpose' => 'Network switch upgrade for improved connectivity',
            'total_estimated_cost' => 150000.00,
            'status' => 'Ordered',
            'remarks' => 'Approved. Order placed with vendor.',
            'submitted_at' => Carbon::now()->subDays(15),
            'approved_at' => Carbon::now()->subDays(13),
            'ordered_at' => Carbon::now()->subDays(10),
        ]);

        $items = [
            [
                'item_name' => 'Cisco Catalyst 9200 Switch',
                'description' => '48-port Gigabit switch',
                'quantity' => 2,
                'unit_price' => 75000.00,
                'total_price' => 150000.00,
                'vendor' => 'Cisco Systems',
            ],
        ];

        foreach ($items as $item) {
            PurchaseRequestItem::create(array_merge($item, ['purchase_request_id' => $pr->id]));
        }

        PurchaseRequestStatusHistory::create([
            'purchase_request_id' => $pr->id,
            'from_status' => null,
            'to_status' => 'Draft',
            'changed_by' => $requestedBy->id,
            'remarks' => 'PR created',
            'created_at' => Carbon::now()->subDays(15),
        ]);

        PurchaseRequestStatusHistory::create([
            'purchase_request_id' => $pr->id,
            'from_status' => 'Draft',
            'to_status' => 'Submitted',
            'changed_by' => $requestedBy->id,
            'remarks' => 'Submitted for approval',
            'created_at' => Carbon::now()->subDays(15),
        ]);

        PurchaseRequestStatusHistory::create([
            'purchase_request_id' => $pr->id,
            'from_status' => 'Submitted',
            'to_status' => 'Approved',
            'changed_by' => $approvedBy->id,
            'remarks' => 'Approved',
            'created_at' => Carbon::now()->subDays(13),
        ]);

        PurchaseRequestStatusHistory::create([
            'purchase_request_id' => $pr->id,
            'from_status' => 'Approved',
            'to_status' => 'Ordered',
            'changed_by' => $approvedBy->id,
            'remarks' => 'Order placed with Cisco Systems',
            'created_at' => Carbon::now()->subDays(10),
        ]);
    }

    private function generatePRNumber(): string
    {
        $year = date('Y');
        $lastPr = PurchaseRequest::where('pr_number', 'like', "PR-{$year}-%")
            ->orderBy('pr_number', 'desc')
            ->first();

        if ($lastPr) {
            $lastNumber = intval(substr($lastPr->pr_number, -3));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return sprintf('PR-%s-%03d', $year, $newNumber);
    }
}
