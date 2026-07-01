<?php

namespace App\Http\Controllers;

use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use App\Models\PurchaseRequestStatusHistory;
use App\Models\DepartmentCategoryBudget;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use App\Services\NotificationService;

class PurchaseRequestController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $query = PurchaseRequest::with(['requester', 'approver', 'department', 'category', 'items', 'statusHistory', 'attachments', 'orderer']);

            // Restrict Department Head to their own department's PRs
            if ($user && $user->isDepartmentHead()) {
                $query->where('department_id', $user->department_id);
            }

            // Filter by status
            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            // Filter by Fiscal Year
            if ($request->filled('fiscalYear') || $request->filled('fiscal_year')) {
                $yearVal = $request->input('fiscalYear', $request->input('fiscal_year'));
                if ($yearVal !== 'All Fiscal Years' && $yearVal !== '') {
                    $query->whereRaw(self::getFiscalYearSqlExpression() . " = ?", [(int)$yearVal]);
                }
            }

            // Filter by Month
            if ($request->filled('month')) {
                $monthVal = $request->input('month');
                if ($monthVal !== 'All Months' && $monthVal !== '') {
                    if (is_numeric($monthVal)) {
                        $query->whereMonth('created_at', (int)$monthVal);
                    } else {
                        $monthMap = [
                            'january' => 1, 'february' => 2, 'march' => 3, 'april' => 4, 'may' => 5, 'june' => 6,
                            'july' => 7, 'august' => 8, 'september' => 9, 'october' => 10, 'november' => 11, 'december' => 12
                        ];
                        $lowerMonth = strtolower($monthVal);
                        if (isset($monthMap[$lowerMonth])) {
                            $query->whereMonth('created_at', $monthMap[$lowerMonth]);
                        }
                    }
                }
            }

            // Filter by department (for admins)
            if ($request->filled('department') && (!$user || !$user->isDepartmentHead())) {
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

            $purchaseRequests = $query->orderBy('id', 'desc')->paginate($request->integer('per_page', 15));

            return response()->json([
                'purchase_requests' => $purchaseRequests->items(),
                'pagination' => [
                    'current_page' => $purchaseRequests->currentPage(),
                    'last_page' => $purchaseRequests->lastPage(),
                    'per_page' => $purchaseRequests->perPage(),
                    'total' => $purchaseRequests->total(),
                ]
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

    public function summary(Request $request)
    {
        try {
            $user = $request->user();
            $query = PurchaseRequest::select('status', DB::raw('count(*) as count'));

            if ($user && $user->isDepartmentHead()) {
                $query->where('department_id', $user->department_id);
            }

            // Filter by Fiscal Year
            if ($request->filled('fiscalYear') || $request->filled('fiscal_year')) {
                $yearVal = $request->input('fiscalYear', $request->input('fiscal_year'));
                if ($yearVal !== 'All Fiscal Years' && $yearVal !== '') {
                    $query->whereRaw(self::getFiscalYearSqlExpression() . " = ?", [(int)$yearVal]);
                }
            }

            // Filter by Month
            if ($request->filled('month')) {
                $monthVal = $request->input('month');
                if ($monthVal !== 'All Months' && $monthVal !== '') {
                    if (is_numeric($monthVal)) {
                        $query->whereMonth('created_at', (int)$monthVal);
                    } else {
                        $monthMap = [
                            'january' => 1, 'february' => 2, 'march' => 3, 'april' => 4, 'may' => 5, 'june' => 6,
                            'july' => 7, 'august' => 8, 'september' => 9, 'october' => 10, 'november' => 11, 'december' => 12
                        ];
                        $lowerMonth = strtolower($monthVal);
                        if (isset($monthMap[$lowerMonth])) {
                            $query->whereMonth('created_at', $monthMap[$lowerMonth]);
                        }
                    }
                }
            }

            $counts = $query->groupBy('status')
                ->get()
                ->pluck('count', 'status')
                ->toArray();

            $statuses = ['Draft', 'Pending', 'Approved', 'Rejected', 'Ordered', 'Received', 'Released', 'Completed'];
            $result = [];
            foreach ($statuses as $status) {
                $result[$status] = $counts[$status] ?? 0;
            }

            return response()->json(['counts' => $result], 200);
        } catch (\Throwable $e) {
            Log::error('Get purchase requests summary failure: ' . $e->getMessage(), [
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
            if (!$request->has('purpose') && $request->has('purpose_of_requests')) {
                $request->merge(['purpose' => $request->input('purpose_of_requests')]);
            }

            $isDraft = $request->input('status') === 'Draft';

            $rules = [
                'purpose' => $isDraft ? 'nullable|string' : 'required|string',
                'department_id' => 'nullable|integer|exists:departments,id',
                'category_id' => 'nullable|integer|exists:categories,id',
                'status' => 'nullable|string'
            ];

            if (!$isDraft) {
                $rules['line_items'] = 'required|array|min:1';
                $rules['line_items.*.item_name'] = 'required|string|max:255';
                $rules['line_items.*.quantity'] = 'required|integer|min:1';
                $rules['line_items.*.unit_price'] = 'required|numeric|min:0';
            } else {
                $rules['line_items'] = 'nullable|array';
                $rules['line_items.*.item_name'] = 'nullable|string|max:255';
                $rules['line_items.*.quantity'] = 'nullable|integer|min:0';
                $rules['line_items.*.unit_price'] = 'nullable|numeric|min:0';
            }

            $request->validate($rules);

            $purchaseRequest = DB::transaction(function () use ($request, $isDraft) {
                $user = $request->user();
                $prNumber = $this->generatePrNumber();

                $pr = PurchaseRequest::create([
                    'pr_number' => $prNumber,
                    'requested_by' => $user->id,
                    'department_id' => $request->input('department_id', $user->department_id),
                    'category_id' => $request->input('category_id'),
                    'purpose' => $request->input('purpose'),
                    'status' => $isDraft ? 'Draft' : 'Pending',
                    'total_estimated_cost' => 0.00,
                ]);

                $totalCost = 0;
                if ($request->has('line_items') && is_array($request->input('line_items'))) {
                    foreach ($request->input('line_items') as $item) {
                        if (empty($item['item_name'])) continue;
                        $quantity = $item['quantity'] ?? 0;
                        $unitPrice = $item['unit_price'] ?? 0;
                        $totalPrice = $quantity * $unitPrice;
                        $totalCost += $totalPrice;

                        $pr->items()->create([
                            'item_name' => $item['item_name'],
                            'description' => $item['description'] ?? null,
                            'quantity' => $quantity,
                            'unit_price' => $unitPrice,
                            'total_price' => $totalPrice,
                            'vendor' => $item['vendor'] ?? null,
                        ]);
                    }
                }

                $pr->update(['total_estimated_cost' => $totalCost]);

                // Budget validation and reservation
                if ($pr->department_id) {
                    $budgets = \App\Models\DepartmentBudget::where('department_id', $pr->department_id)
                        ->where('fiscal_year', self::getFiscalYear($pr->created_at))
                        ->orderBy('id', 'asc')
                        ->lockForUpdate()
                        ->get();
                        
                    if ($budgets->isEmpty()) {
                        throw new \Exception("Department budget not found for current fiscal year.");
                    }

                    $deptAvailable = $budgets->sum('allocated_amount') - ($budgets->sum('reserved_amount') + $budgets->sum('spent_amount'));
                    $primaryBudget = $budgets->first();

                    if ($pr->category_id) {
                        $catBudgets = \App\Models\DepartmentCategoryBudget::whereIn('department_budget_id', $budgets->pluck('id'))
                            ->where('category_id', $pr->category_id)
                            ->lockForUpdate()
                            ->get();

                        if ($catBudgets->isEmpty()) {
                            throw new \Exception("Category budget not found.");
                        }

                        $catAvailable = $catBudgets->sum('allocated_amount') - ($catBudgets->sum('reserved_amount') + $catBudgets->sum('spent_amount'));

                        if ($totalCost > $catAvailable) {
                            throw new \Exception("Insufficient category budget. Available: ₱" . number_format($catAvailable, 2));
                        }

                        $catBudgets->first()->increment('reserved_amount', $totalCost);
                    } else {
                        if ($totalCost > $deptAvailable) {
                            throw new \Exception("Insufficient department budget. Available: ₱" . number_format($deptAvailable, 2));
                        }
                    }

                    $primaryBudget->increment('reserved_amount', $totalCost);
                }

                PurchaseRequestStatusHistory::create([
                    'purchase_request_id' => $pr->id,
                    'from_status' => null,
                    'to_status' => $isDraft ? 'Draft' : 'Pending',
                    'changed_by' => $user->id,
                    'remarks' => $isDraft ? 'Draft created.' : 'Purchase Request pending approval.',
                ]);

                if (!$isDraft) {
                    NotificationService::notifyAdminsNewPR($pr);
                }

                return $pr;
            });

            return response()->json([
                'message' => 'Purchase request created successfully.',
                'purchase_request' => $purchaseRequest->load(['items', 'requester', 'department', 'category', 'attachments'])
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
            $pr = PurchaseRequest::with(['items', 'requester', 'approver', 'department', 'category', 'statusHistory', 'attachments', 'orderer'])->find($id);

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

            if (!$request->has('purpose') && $request->has('purpose_of_requests')) {
                $request->merge(['purpose' => $request->input('purpose_of_requests')]);
            }

            $isDraft = $request->input('status') === 'Draft';

            $rules = [
                'purpose' => 'nullable|string',
                'status' => 'nullable|string',
                'remarks' => 'nullable|string',
                'department_id' => 'nullable|integer|exists:departments,id',
                'category_id' => 'nullable|integer|exists:categories,id',
            ];

            if (!$isDraft && $request->has('status') && $request->input('status') !== 'Draft') {
                $rules['purpose'] = 'sometimes|required|string';
                $rules['line_items'] = 'sometimes|required|array|min:1';
                $rules['line_items.*.item_name'] = 'required|string|max:255';
                $rules['line_items.*.quantity'] = 'required|integer|min:1';
                $rules['line_items.*.unit_price'] = 'required|numeric|min:0';
            } else {
                $rules['line_items'] = 'nullable|array';
                $rules['line_items.*.item_name'] = 'nullable|string|max:255';
                $rules['line_items.*.quantity'] = 'nullable|integer|min:0';
                $rules['line_items.*.unit_price'] = 'nullable|numeric|min:0';
            }

            $request->validate($rules);

            $oldStatus = $pr->status;
            DB::transaction(function () use ($request, $pr, $oldStatus) {
                $updateData = [];
                if ($request->has('purpose')) $updateData['purpose'] = $request->input('purpose');
                if ($request->has('status')) {
                    $st = $request->input('status');
                    if ($st === 'Approve') $st = 'Approved';
                    if ($st === 'Request') $st = 'Pending';
                    
                    if ($st === 'Completed' && $oldStatus !== 'Completed') {
                        if (!$request->user() || !$request->user()->isDepartmentHead()) {
                            throw new \Exception("Only Department Heads can confirm receipt and mark a purchase request as Completed.");
                        }
                    }
                    
                    $updateData['status'] = $st;
                }
                if ($request->has('remarks')) $updateData['remarks'] = $request->input('remarks');
                if ($request->has('department_id')) $updateData['department_id'] = $request->input('department_id');
                if ($request->has('category_id')) $updateData['category_id'] = $request->input('category_id');

                // Procurement fields
                if ($request->has('supplier_name')) $updateData['supplier_name'] = $request->input('supplier_name');
                if ($request->has('purchase_order_number')) $updateData['purchase_order_number'] = $request->input('purchase_order_number');
                if ($request->has('expected_delivery_date')) $updateData['expected_delivery_date'] = $request->input('expected_delivery_date');
                if ($request->has('procurement_remarks')) $updateData['procurement_remarks'] = $request->input('procurement_remarks');

                if (isset($updateData['status']) && $updateData['status'] === 'Ordered' && $oldStatus !== 'Ordered') {
                    $updateData['ordered_at'] = now();
                    $updateData['ordered_by'] = $request->user()?->id;
                }

                $pr->update($updateData);

                if ($request->has('line_items')) {
                    $pr->items()->delete();

                    $totalCost = 0;
                    if (is_array($request->input('line_items'))) {
                        foreach ($request->input('line_items') as $item) {
                            if (empty($item['item_name'])) continue;
                            $quantity = $item['quantity'] ?? 0;
                            $unitPrice = $item['unit_price'] ?? 0;
                            $totalPrice = $quantity * $unitPrice;
                            $totalCost += $totalPrice;

                            $pr->items()->create([
                                'item_name' => $item['item_name'],
                                'description' => $item['description'] ?? null,
                                'quantity' => $quantity,
                                'unit_price' => $unitPrice,
                                'total_price' => $totalPrice,
                                'vendor' => $item['vendor'] ?? null,
                            ]);
                        }
                    }

                    $pr->update(['total_estimated_cost' => $totalCost]);
                }

                $newStatus = $pr->status;

                if ($newStatus === 'Pending' && in_array($oldStatus, ['Draft', 'Rejected'])) {
                    $totalCost = $pr->total_estimated_cost;
                    
                    $primaryBudget = \App\Models\DepartmentBudget::where('department_id', $pr->department_id)
                        ->where('fiscal_year', self::getFiscalYear($pr->created_at))
                        ->lockForUpdate()
                        ->first();

                    if (!$primaryBudget) {
                        throw new \Exception("Department budget not found for the current fiscal year.");
                    }

                    $deptAvailable = $primaryBudget->allocated_amount - ($primaryBudget->reserved_amount + $primaryBudget->spent_amount);

                    if ($pr->category_id) {
                        $catBudgets = \App\Models\DepartmentCategoryBudget::where('department_budget_id', $primaryBudget->id)
                            ->where('category_id', $pr->category_id)
                            ->lockForUpdate()
                            ->get();

                        if ($catBudgets->isEmpty()) {
                            throw new \Exception("Category budget not found.");
                        }

                        $catAvailable = $catBudgets->sum('allocated_amount') - ($catBudgets->sum('reserved_amount') + $catBudgets->sum('spent_amount'));

                        if ($totalCost > $catAvailable) {
                            throw new \Exception("Insufficient category budget. Available: ₱" . number_format($catAvailable, 2));
                        }

                        $catBudgets->first()->increment('reserved_amount', $totalCost);
                    } else {
                        if ($totalCost > $deptAvailable) {
                            throw new \Exception("Insufficient department budget. Available: ₱" . number_format($deptAvailable, 2));
                        }
                    }

                    $primaryBudget->increment('reserved_amount', $totalCost);
                }
                if ($newStatus !== $oldStatus) {
                    PurchaseRequestStatusHistory::create([
                        'purchase_request_id' => $pr->id,
                        'from_status' => $oldStatus,
                        'to_status' => $newStatus,
                        'changed_by' => $request->user()?->id ?? $pr->requested_by,
                        'remarks' => $request->input('remarks', "Status updated to {$newStatus}"),
                    ]);
                    
                    if ($newStatus === 'Pending' && in_array($oldStatus, ['Draft', 'Rejected'])) {
                        NotificationService::notifyAdminsNewPR($pr);
                    } else if ($newStatus !== 'Draft') {
                        NotificationService::notifyDeptHeadStatusChange($pr, $newStatus, $request->input('remarks'));
                    }
                }

                if (in_array($newStatus, ['Released', 'Received', 'Completed']) && !in_array($oldStatus, ['Released', 'Received', 'Completed'])) {
                    if ($pr->department_id) {
                        $budget = \App\Models\DepartmentBudget::where('department_id', $pr->department_id)
                            ->where('fiscal_year', self::getFiscalYear($pr->created_at))
                            ->orderBy('id', 'asc')
                            ->lockForUpdate()
                            ->first();
                        if ($budget) {
                            $budget->decrement('reserved_amount', $pr->total_estimated_cost);
                            $budget->increment('spent_amount', $pr->total_estimated_cost);

                            if ($pr->category_id) {
                                $catBudget = DepartmentCategoryBudget::where('department_budget_id', $budget->id)
                                    ->where('category_id', $pr->category_id)
                                    ->lockForUpdate()
                                    ->first();
                                if ($catBudget) {
                                    $catBudget->decrement('reserved_amount', $pr->total_estimated_cost);
                                    $catBudget->increment('spent_amount', $pr->total_estimated_cost);
                                }
                            }
                        }
                    }
                }
            });

            return response()->json([
                'message' => 'Purchase request updated successfully.',
                'purchase_request' => $pr->fresh()->load(['items', 'requester', 'department', 'category', 'attachments'])
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

    public function uploadAttachments(Request $request, $id)
    {
        try {
            $pr = PurchaseRequest::find($id);
            if (!$pr) {
                return response()->json(['message' => 'Purchase request not found.'], 404);
            }

            $request->validate([
                'files' => 'required|array',
                'files.*' => 'required|file|max:10240',
            ]);

            $user = $request->user();
            $uploadedAttachments = [];

            foreach ($request->file('files') as $file) {
                $fileName = time() . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('purchase-requests/' . $pr->id, $fileName, 'public');

                $attachment = $pr->attachments()->create([
                    'file_name' => $file->getClientOriginalName(),
                    'file_path' => $filePath,
                    'file_size' => $file->getSize(),
                    'file_type' => $file->getClientMimeType() ?? 'application/octet-stream',
                    'uploaded_by' => $user->id,
                    'created_at' => now(),
                ]);

                $uploadedAttachments[] = $attachment;
            }

            return response()->json([
                'message' => 'Attachments uploaded successfully.',
                'attachments' => $uploadedAttachments,
                'purchase_request' => $pr->fresh()->load(['items', 'requester', 'approver', 'department', 'category', 'statusHistory', 'attachments'])
            ], 201);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('Upload attachment failure: ' . $e->getMessage(), [
                'pr_id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An unexpected error occurred while uploading attachments.'
            ], 500);
        }
    }

    public function downloadAttachment(Request $request, $prId, $attachmentId)
    {
        try {
            $attachment = \App\Models\PurchaseRequestAttachment::where('purchase_request_id', $prId)
                ->where('id', $attachmentId)
                ->first();

            if (!$attachment || !\Illuminate\Support\Facades\Storage::disk('public')->exists($attachment->file_path)) {
                return response()->json(['message' => 'Attachment file not found.'], 404);
            }

            $absolutePath = \Illuminate\Support\Facades\Storage::disk('public')->path($attachment->file_path);
            return response()->download(
                $absolutePath,
                $attachment->file_name,
                ['Content-Type' => $attachment->file_type]
            );
        } catch (\Throwable $e) {
            Log::error('Download attachment failure: ' . $e->getMessage(), [
                'pr_id' => $prId,
                'attachment_id' => $attachmentId,
            ]);
            return response()->json(['message' => 'Failed to download attachment.'], 500);
        }
    }

    public function deleteAttachment(Request $request, $prId, $attachmentId)
    {
        try {
            $attachment = \App\Models\PurchaseRequestAttachment::where('purchase_request_id', $prId)
                ->where('id', $attachmentId)
                ->first();

            if (!$attachment) {
                return response()->json(['message' => 'Attachment not found.'], 404);
            }

            if (\Illuminate\Support\Facades\Storage::disk('public')->exists($attachment->file_path)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($attachment->file_path);
            }

            $attachment->delete();

            $pr = PurchaseRequest::find($prId);

            return response()->json([
                'message' => 'Attachment deleted successfully.',
                'purchase_request' => $pr ? $pr->fresh()->load(['items', 'requester', 'approver', 'department', 'category', 'statusHistory', 'attachments']) : null
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Delete attachment failure: ' . $e->getMessage(), [
                'pr_id' => $prId,
                'attachment_id' => $attachmentId,
            ]);
            return response()->json(['message' => 'Failed to delete attachment.'], 500);
        }
    }

    private function generatePrNumber(): string
    {
        $year = self::getFiscalYear(now());
        $prefix = "PR-{$year}-";

        $lastPr = PurchaseRequest::where('pr_number', 'like', "{$prefix}%")
            ->lockForUpdate()
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
