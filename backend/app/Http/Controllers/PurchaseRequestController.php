<?php

namespace App\Http\Controllers;

use App\Models\PurchaseRequest;
use App\Models\PrLineItem;
use App\Models\ApprovalForm;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class PurchaseRequestController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = PurchaseRequest::with(['user', 'lineItems', 'approvals.approver']);

            // Filter by status
            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            // Filter by department (of the requester user)
            if ($request->filled('department')) {
                $department = $request->input('department');
                $query->whereHas('user', function ($q) use ($department) {
                    $q->where('department', $department);
                });
            }

            // Search filter (PR number, purpose, or requester name/email)
            if ($request->filled('search')) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('pr_number', 'like', "%{$search}%")
                      ->orWhere('purpose_of_requests', 'like', "%{$search}%")
                      ->orWhereHas('user', function ($uq) use ($search) {
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
                'purpose_of_requests' => 'required|string',
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
                    'user_id' => $user->id,
                    'purpose_of_requests' => $request->input('purpose_of_requests'),
                    'status' => 'Request',
                    'total_estimated_cost' => 0.00,
                ]);

                $totalCost = 0;
                foreach ($request->input('line_items') as $item) {
                    $totalPrice = $item['quantity'] * $item['unit_price'];
                    $totalCost += $totalPrice;

                    $pr->lineItems()->create([
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
                'purchase_request' => $purchaseRequest->load('lineItems')
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
            $pr = PurchaseRequest::with(['lineItems', 'user', 'approvals.approver'])->find($id);

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
                'purpose_of_requests' => 'required|string',
                'status' => 'nullable|string|in:Request,Approve,Released,Received',
                'line_items' => 'required|array|min:1',
                'line_items.*.item_name' => 'required|string|max:255',
                'line_items.*.description' => 'nullable|string',
                'line_items.*.quantity' => 'required|integer|min:1',
                'line_items.*.unit_price' => 'required|numeric|min:0',
                'line_items.*.vendor' => 'nullable|string|max:255',
            ]);

            DB::transaction(function () use ($request, $pr) {
                $pr->update([
                    'purpose_of_requests' => $request->input('purpose_of_requests'),
                    'status' => $request->input('status', $pr->status),
                ]);

                // Delete old line items
                $pr->lineItems()->delete();

                // Create new line items
                $totalCost = 0;
                foreach ($request->input('line_items') as $item) {
                    $totalPrice = $item['quantity'] * $item['unit_price'];
                    $totalCost += $totalPrice;

                    $pr->lineItems()->create([
                        'item_name' => $item['item_name'],
                        'description' => $item['description'] ?? null,
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'total_price' => $totalPrice,
                        'vendor' => $item['vendor'] ?? null,
                    ]);
                }

                $pr->update(['total_estimated_cost' => $totalCost]);
            });

            return response()->json([
                'message' => 'Purchase request updated successfully.',
                'purchase_request' => $pr->load('lineItems')
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
