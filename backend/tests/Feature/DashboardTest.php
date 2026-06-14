<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\PurchaseRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $employee1;
    protected User $employee2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'role' => 'admin',
            'status' => 'active',
            'department' => 'IT',
        ]);

        $this->employee1 = User::factory()->create([
            'role' => 'employee',
            'status' => 'active',
            'department' => 'HR',
        ]);

        $this->employee2 = User::factory()->create([
            'role' => 'employee',
            'status' => 'suspended',
            'department' => 'Operations',
        ]);

        // Create a PR approved this month
        $pr1 = PurchaseRequest::create([
            'pr_number' => 'PR-2026-001',
            'user_id' => $this->employee1->id,
            'purpose_of_requests' => 'HR Office Supplies',
            'status' => 'Approve',
            'total_estimated_cost' => 500.00,
        ]);
        $pr1->created_at = now();
        $pr1->save();

        // Create a bottleneck PR (status Request, created > 48 hours ago)
        $pr2 = PurchaseRequest::create([
            'pr_number' => 'PR-2026-002',
            'user_id' => $this->employee1->id,
            'purpose_of_requests' => 'Laptops',
            'status' => 'Request',
            'total_estimated_cost' => 2000.00,
        ]);
        $pr2->created_at = now()->subDays(3);
        $pr2->save();

        // Create a regular request PR (created recently)
        $pr3 = PurchaseRequest::create([
            'pr_number' => 'PR-2026-003',
            'user_id' => $this->employee2->id,
            'purpose_of_requests' => 'Operations tools',
            'status' => 'Request',
            'total_estimated_cost' => 150.00,
        ]);
        $pr3->created_at = now();
        $pr3->save();
    }

    public function test_get_dashboard_metrics(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/dashboard/metrics');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'metrics' => [
                'total_spent',
                'total_spent_change_percentage',
                'bottlenecks',
                'active_users',
                'monthly_data' => [
                    '*' => [
                        'month',
                        'spent',
                    ]
                ],
                'department_breakdown' => [
                    '*' => [
                        'department',
                        'pr_count',
                        'total_spent',
                    ]
                ]
            ]
        ]);

        // total spent should be 500 (since only one is 'Approve')
        $response->assertJsonPath('metrics.total_spent', 500);

        // bottlenecks should be 1 (PR-2026-002 is Request and > 48h old)
        $response->assertJsonPath('metrics.bottlenecks', 1);

        // active users should be 2 (admin and employee1)
        $response->assertJsonPath('metrics.active_users', 2);
    }

    public function test_get_recent_prs(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/dashboard/recent-prs');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'recent_purchase_requests' => [
                '*' => [
                    'id',
                    'pr_number',
                    'purpose_of_requests',
                    'status',
                    'total_estimated_cost',
                    'user',
                ]
            ]
        ]);

        // Should return 3 purchase requests
        $response->assertJsonCount(3, 'recent_purchase_requests');
        
        // The first one in descending order should be PR-2026-003 or PR-2026-001 (since both created now())
        $response->assertJsonPath('recent_purchase_requests.2.pr_number', 'PR-2026-002'); // created 3 days ago, so last
    }

    public function test_get_pending_approvals(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/dashboard/pending-approvals');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'pending_approvals' => [
                '*' => [
                    'id',
                    'pr_number',
                    'status',
                    'user',
                ]
            ]
        ]);

        // Only PRs with status = 'Request' should be returned (PR-2026-002 and PR-2026-003)
        $response->assertJsonCount(2, 'pending_approvals');
        $response->assertJsonFragment(['pr_number' => 'PR-2026-002']);
        $response->assertJsonFragment(['pr_number' => 'PR-2026-003']);
        $response->assertJsonMissingExact(['pr_number' => 'PR-2026-001']); // status Approve
    }
}
