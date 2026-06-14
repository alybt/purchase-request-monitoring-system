<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\PurchaseRequest;
use App\Models\PrLineItem;
use App\Models\ApprovalForm;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PurchaseRequestTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $approver;
    protected User $employee1;
    protected User $employee2;
    protected PurchaseRequest $pr1;
    protected PurchaseRequest $pr2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'role' => 'admin',
            'status' => 'active',
            'department' => 'IT',
        ]);

        $this->approver = User::factory()->create([
            'role' => 'approver',
            'status' => 'active',
            'department' => 'Finance',
        ]);

        $this->employee1 = User::factory()->create([
            'role' => 'employee',
            'status' => 'active',
            'department' => 'HR',
            'first_name' => 'Alice',
            'last_name' => 'Smith',
        ]);

        $this->employee2 = User::factory()->create([
            'role' => 'employee',
            'status' => 'active',
            'department' => 'Operations',
            'first_name' => 'Bob',
            'last_name' => 'Jones',
        ]);

        $this->pr1 = PurchaseRequest::create([
            'pr_number' => 'PR-2026-001',
            'user_id' => $this->employee1->id,
            'purpose_of_requests' => 'Office Supply Upgrades',
            'status' => 'Request',
            'total_estimated_cost' => 100.00,
        ]);

        $this->pr1->lineItems()->create([
            'item_name' => 'Notebooks',
            'quantity' => 10,
            'unit_price' => 10.00,
            'total_price' => 100.00,
        ]);

        $this->pr2 = PurchaseRequest::create([
            'pr_number' => 'PR-2026-002',
            'user_id' => $this->employee2->id,
            'purpose_of_requests' => 'Server Equipment',
            'status' => 'Approve',
            'total_estimated_cost' => 1200.00,
        ]);

        $this->pr2->lineItems()->create([
            'item_name' => 'NAS Drive',
            'quantity' => 2,
            'unit_price' => 600.00,
            'total_price' => 1200.00,
        ]);
    }

    public function test_list_purchase_requests(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/purchase-requests');

        $response->assertStatus(200);
        $response->assertJsonCount(2, 'purchase_requests');
    }

    public function test_list_purchase_requests_filter_by_status(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/purchase-requests?status=Approve');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'purchase_requests');
        $response->assertJsonFragment(['pr_number' => 'PR-2026-002']);
    }

    public function test_list_purchase_requests_filter_by_department(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/purchase-requests?department=HR');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'purchase_requests');
        $response->assertJsonFragment(['pr_number' => 'PR-2026-001']);
    }

    public function test_list_purchase_requests_search(): void
    {
        // Search by PR number
        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/purchase-requests?search=002');
        $response->assertStatus(200);
        $response->assertJsonCount(1, 'purchase_requests');
        $response->assertJsonFragment(['pr_number' => 'PR-2026-002']);

        // Search by purpose
        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/purchase-requests?search=Supply');
        $response->assertStatus(200);
        $response->assertJsonCount(1, 'purchase_requests');
        $response->assertJsonFragment(['pr_number' => 'PR-2026-001']);

        // Search by requester name
        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/purchase-requests?search=Alice');
        $response->assertStatus(200);
        $response->assertJsonCount(1, 'purchase_requests');
        $response->assertJsonFragment(['pr_number' => 'PR-2026-001']);
    }

    public function test_create_purchase_request(): void
    {
        $response = $this->actingAs($this->employee1, 'sanctum')->postJson('/api/purchase-requests', [
            'purpose_of_requests' => 'New Projector',
            'line_items' => [
                [
                    'item_name' => 'Epson Projector',
                    'description' => '4K projector for meeting rooms',
                    'quantity' => 1,
                    'unit_price' => 500.00,
                    'vendor' => 'Epson Store',
                ],
                [
                    'item_name' => 'Projector Screen',
                    'quantity' => 2,
                    'unit_price' => 100.00,
                    'vendor' => 'Screens Inc.',
                ]
            ]
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'message',
            'purchase_request' => [
                'id',
                'pr_number',
                'purpose_of_requests',
                'status',
                'total_estimated_cost',
                'line_items' => [
                    '*' => [
                        'id',
                        'item_name',
                        'quantity',
                        'unit_price',
                        'total_price',
                    ]
                ]
            ]
        ]);

        $this->assertDatabaseHas('purchase_requests', [
            'purpose_of_requests' => 'New Projector',
            'total_estimated_cost' => 700.00,
            'status' => 'Request',
        ]);

        $this->assertDatabaseHas('pr_line_items', [
            'item_name' => 'Epson Projector',
            'total_price' => 500.00,
        ]);

        $this->assertDatabaseHas('pr_line_items', [
            'item_name' => 'Projector Screen',
            'total_price' => 200.00,
        ]);
    }

    public function test_get_single_purchase_request(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/purchase-requests/' . $this->pr1->id);

        $response->assertStatus(200);
        $response->assertJsonPath('purchase_request.pr_number', 'PR-2026-001');
        $response->assertJsonCount(1, 'purchase_request.line_items');
    }

    public function test_update_purchase_request(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->putJson('/api/purchase-requests/' . $this->pr1->id, [
            'purpose_of_requests' => 'Updated Office Supplies',
            'status' => 'Released',
            'line_items' => [
                [
                    'item_name' => 'Notebooks Premium',
                    'quantity' => 5,
                    'unit_price' => 20.00,
                ],
                [
                    'item_name' => 'Pens',
                    'quantity' => 10,
                    'unit_price' => 2.50,
                ]
            ]
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('purchase_request.total_estimated_cost', 125);

        $this->assertDatabaseHas('purchase_requests', [
            'id' => $this->pr1->id,
            'purpose_of_requests' => 'Updated Office Supplies',
            'status' => 'Released',
            'total_estimated_cost' => 125.00,
        ]);

        // Old line items should be deleted
        $this->assertDatabaseMissing('pr_line_items', [
            'item_name' => 'Notebooks',
        ]);

        // New line items should be created
        $this->assertDatabaseHas('pr_line_items', [
            'item_name' => 'Notebooks Premium',
            'total_price' => 100.00,
        ]);
        $this->assertDatabaseHas('pr_line_items', [
            'item_name' => 'Pens',
            'total_price' => 25.00,
        ]);
    }

    public function test_delete_purchase_request(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->deleteJson('/api/purchase-requests/' . $this->pr1->id);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('purchase_requests', ['id' => $this->pr1->id]);
        $this->assertDatabaseMissing('pr_line_items', ['pr_id' => $this->pr1->id]);
    }

    public function test_bulk_delete_purchase_requests(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/purchase-requests/bulk-delete', [
            'ids' => [$this->pr1->id, $this->pr2->id]
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseMissing('purchase_requests', ['id' => $this->pr1->id]);
        $this->assertDatabaseMissing('purchase_requests', ['id' => $this->pr2->id]);
    }

    public function test_approve_purchase_request(): void
    {
        $response = $this->actingAs($this->approver, 'sanctum')->postJson('/api/purchase-requests/' . $this->pr1->id . '/approve', [
            'comments' => 'Looks good, approved budget.',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('purchase_requests', [
            'id' => $this->pr1->id,
            'status' => 'Approve',
        ]);

        $this->assertDatabaseHas('approval_form', [
            'pr_id' => $this->pr1->id,
            'approver_id' => $this->approver->id,
            'status' => 'Approve',
            'comments' => 'Looks good, approved budget.',
        ]);
    }

    public function test_reject_purchase_request(): void
    {
        $response = $this->actingAs($this->approver, 'sanctum')->postJson('/api/purchase-requests/' . $this->pr1->id . '/reject', [
            'comments' => 'Too expensive, reject.',
        ]);

        $response->assertStatus(200);
        
        // Status should be unchanged/not modified on PR (remains Request)
        $this->assertDatabaseHas('purchase_requests', [
            'id' => $this->pr1->id,
            'status' => 'Request',
        ]);

        // Rejection should be recorded in approval form
        $this->assertDatabaseHas('approval_form', [
            'pr_id' => $this->pr1->id,
            'approver_id' => $this->approver->id,
            'status' => 'Reject',
            'comments' => 'Too expensive, reject.',
        ]);
    }
}
