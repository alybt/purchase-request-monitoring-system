<?php

namespace App\Http\Controllers;

use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class PurchaseRequestController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = PurchaseRequest::with(['requester', 'approver', 'department', 'category', 'items', 'statusHistory']);

            // Filter by status
            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            // Filter by department
            if ($request->filled('department')) {
                $department = $request->input('department');
                $query->whereHas('department', function ($q) use ($department) {
                    $q->where('name', $department)->orWhere('code', $department);
                });
            }

            // Search filter (PR number, purpose, or requester name/email)
            if ($request->filled('search')) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('pr_number', 'like', "%{$search}%")
                      ->orWhere('purpose', 'like', "%{$search}%")
                      ->orWhereHas('requester', function ($uq) use ($search) {
                          $uq->where('first_name', 'like', "%{$search}%")
                            ->orWhere('middle_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                      });
                });
            }

            $purchaseRequests = $query->orderBy('id', 'desc')->get();

            return response()->json([
                'purchase_requests' => $purchaseRequests
            ], 200);
        } catch (\Throwable $e) {
            Log::error('List purchase requests failure: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An unexpected error occurred. Please try again later.'
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'purpose' => 'required|string',
                'department_id' => 'nullable|integer|exists:departments,id',
                'category_id' => 'nullable|integer|exists:categories,id',
                'line_items' => 'required|array|min:1',
                'line_items.*.item_name' => 'required|string|max:255',
                'line_items.*.description' => 'nullable|string',
                'line_items.*.quantity' => 'required|integer|min:1',
                'line_items.*.unit_price' => 'required|numeric|min:0',
                'line_items.*.vendor' => 'nullable|string|max:255',
            ]);

            $purchaseRequest = DB::transaction(function () use ($request) {
                $user = $request->user();
                $prNumber = $this->generatePrNumber();

                $pr = PurchaseRequest::create([
                    'pr_number' => $prNumber,
                    'requested_by' => $user->id,
                    'department_id' => $request->input('department_id', $user->department_id),
                    'category_id' => $request->input('category_id'),
                    'purpose' => $request->input('purpose'),
                    'status' => 'Draft',
                    'total_estimated_cost' => 0.00,
                ]);

                $totalCost = 0;
                foreach ($request->input('line_items') as $item) {
                    $totalPrice = $item['quantity'] * $item['unit_price'];
                    $totalCost += $totalPrice;

                    $pr->items()->create([
                        'item_name' => $item['item_name'],
                        'description' => $item['description'] ?? null,
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'total_price' => $totalPrice,
                        'vendor' => $item['vendor'] ?? null,
                    ]);
                }

                $pr->update(['total_estimated_cost' => $totalCost]);

                return $pr;
            });

            return response()->json([
                'message' => 'Purchase request created successfully.',
                'purchase_request' => $purchaseRequest->load(['items', 'requester', 'department', 'category'])
            ], 201);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('Create purchase request failure: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An unexpected error occurred. Please try again later.'
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $pr = PurchaseRequest::with(['items', 'requester', 'approver', 'department', 'category', 'statusHistory'])->find($id);

            if (!$pr) {
                return response()->json([
                    'message' => 'Purchase request not found.'
                ], 404);
            }

            return response()->json([
                'purchase_request' => $pr
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Get single purchase request failure: ' . $e->getMessage(), [
                'pr_id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An unexpected error occurred. Please try again later.'
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $pr = PurchaseRequest::find($id);

            if (!$pr) {
                return response()->json([
                    'message' => 'Purchase request not found.'
                ], 404);
            }

            $request->validate([
                'purpose' => 'sometimes|required|string',
                'status' => 'nullable|string|in:Draft,Submitted,Approved,Rejected,Ordered,Received,Released,Completed',
                'remarks' => 'nullable|string',
                'department_id' => 'nullable|integer|exists:departments,id',
                'category_id' => 'nullable|integer|exists:categories,id',
                'line_items' => 'sometimes|required|array|min:1',
                'line_items.*.item_name' => 'required|string|max:255',
                'line_items.*.description' => 'nullable|string',
                'line_items.*.quantity' => 'required|integer|min:1',
                'line_items.*.unit_price' => 'required|numeric|min:0',
                'line_items.*.vendor' => 'nullable|string|max:255',
            ]);

            DB::transaction(function () use ($request, $pr) {
                $updateData = [];
                if ($request->has('purpose')) $updateData['purpose'] = $request->input('purpose');
                if ($request->has('status')) $updateData['status'] = $request->input('status');
                if ($request->has('remarks')) $updateData['remarks'] = $request->input('remarks');
                if ($request->has('department_id')) $updateData['department_id'] = $request->input('department_id');
                if ($request->has('category_id')) $updateData['category_id'] = $request->input('category_id');

                $pr->update($updateData);

                if ($request->has('line_items')) {
                    $pr->items()->delete();

                    $totalCost = 0;
                    foreach ($request->input('line_items') as $item) {
                        $totalPrice = $item['quantity'] * $item['unit_price'];
                        $totalCost += $totalPrice;

                        $pr->items()->create([
                            'item_name' => $item['item_name'],
                            'description' => $item['description'] ?? null,
                            'quantity' => $item['quantity'],
                            'unit_price' => $item['unit_price'],
                            'total_price' => $totalPrice,
                            'vendor' => $item['vendor'] ?? null,
                        ]);
                    }

                    $pr->update(['total_estimated_cost' => $totalCost]);
                }
            });

            return response()->json([
                'message' => 'Purchase request updated successfully.',
                'purchase_request' => $pr->fresh()->load(['items', 'requester', 'department', 'category'])
            ], 200);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('Update purchase request failure: ' . $e->getMessage(), [
                'pr_id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An unexpected error occurred. Please try again later.'
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $pr = PurchaseRequest::find($id);

            if (!$pr) {
                return response()->json([
                    'message' => 'Purchase request not found.'
                ], 404);
            }

            $pr->delete();

            return response()->json([
                'message' => 'Purchase request deleted successfully.'
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Delete purchase request failure: ' . $e->getMessage(), [
                'pr_id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An unexpected error occurred. Please try again later.'
            ], 500);
        }
    }

    public function bulkDestroy(Request $request)
    {
        try {
            $request->validate([
                'ids' => 'required|array',
                'ids.*' => 'required|integer|exists:purchase_requests,id',
            ]);

            $ids = $request->input('ids');

            PurchaseRequest::whereIn('id', $ids)->delete();

            return response()->json([
                'message' => 'Purchase requests deleted successfully.'
            ], 200);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('Bulk delete purchase requests failure: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An unexpected error occurred. Please try again later.'
            ], 500);
        }
    }

    private function generatePrNumber(): string
    {
        $year = date('Y');
        $prefix = "PR-{$year}-";

        $lastPr = PurchaseRequest::where('pr_number', 'like', "{$prefix}%")
            ->orderBy('pr_number', 'desc')
            ->first();

        if ($lastPr) {
            $lastNum = intval(substr($lastPr->pr_number, strlen($prefix)));
            $nextNum = $lastNum + 1;
        } else {
            $nextNum = 1;
        }

        return $prefix . str_pad($nextNum, 3, '0', STR_PAD_LEFT);
    }
}
