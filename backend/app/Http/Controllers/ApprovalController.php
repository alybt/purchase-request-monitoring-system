<?php

namespace App\Http\Controllers;

use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestStatusHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class ApprovalController extends Controller
{
    public function approve(Request $request, $id)
    {
        try {
            $pr = PurchaseRequest::find($id);

            if (!$pr) {
                return response()->json(['message' => 'Purchase request not found.'], 404);
            }

            if ($pr->requested_by === $request->user()->id) {
                return response()->json(['message' => 'You cannot approve or reject your own purchase request.'], 403);
            }

            if (!$pr->canBeApproved()) {
                return response()->json(['message' => 'Purchase request cannot be approved in its current status.'], 422);
            }

            $request->validate([
                'remarks' => 'nullable|string',
            ]);

            $user = $request->user();
            $fromStatus = $pr->status;

            DB::transaction(function () use ($pr, $user, $request, $fromStatus) {
                $pr->update([
                    'status' => 'Approved',
                    'approved_by' => $user->id,
                    'approved_at' => now(),
                    'remarks' => $request->input('remarks'),
                ]);

                PurchaseRequestStatusHistory::create([
                    'purchase_request_id' => $pr->id,
                    'from_status' => $fromStatus,
                    'to_status' => 'Approved',
                    'changed_by' => $user->id,
                    'remarks' => $request->input('remarks') ?? 'Approved',
                ]);

                if ($pr->department_id) {
                    $budget = \App\Models\DepartmentBudget::where('department_id', $pr->department_id)
                        ->where('fiscal_year', date('Y', strtotime($pr->created_at ?? now())))
                        ->where('month', date('n', strtotime($pr->created_at ?? now())))
                        ->lockForUpdate()
                        ->first();
                    if ($budget) {
                        $budget->increment('reserved_amount', $pr->total_estimated_cost);
                    }
                }
            });

            return response()->json([
                'message' => 'Purchase request approved successfully.',
                'purchase_request' => $pr->fresh()->load(['items', 'requester', 'approver', 'department', 'category', 'statusHistory'])
            ], 200);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('Approve purchase request failure: ' . $e->getMessage(), [
                'pr_id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['message' => 'An unexpected error occurred. Please try again later.'], 500);
        }
    }

    public function reject(Request $request, $id)
    {
        try {
            $pr = PurchaseRequest::find($id);

            if (!$pr) {
                return response()->json(['message' => 'Purchase request not found.'], 404);
            }

            if ($pr->requested_by === $request->user()->id) {
                return response()->json(['message' => 'You cannot approve or reject your own purchase request.'], 403);
            }

            if (!$pr->canBeRejected()) {
                return response()->json(['message' => 'Purchase request cannot be rejected in its current status.'], 422);
            }

            $request->validate([
                'remarks' => 'nullable|string',
                'rejection_reason' => 'nullable|string',
            ]);

            $user = $request->user();
            $fromStatus = $pr->status;

            DB::transaction(function () use ($pr, $user, $request, $fromStatus) {
                $pr->update([
                    'status' => 'Rejected',
                    'rejection_reason' => $request->input('rejection_reason') ?? $request->input('remarks'),
                    'remarks' => $request->input('remarks'),
                ]);

                PurchaseRequestStatusHistory::create([
                    'purchase_request_id' => $pr->id,
                    'from_status' => $fromStatus,
                    'to_status' => 'Rejected',
                    'changed_by' => $user->id,
                    'remarks' => $request->input('rejection_reason') ?? $request->input('remarks') ?? 'Rejected',
                ]);

                if (in_array($fromStatus, ['Approved', 'Approve', 'Ordered'])) {
                    if ($pr->department_id) {
                        $budget = \App\Models\DepartmentBudget::where('department_id', $pr->department_id)
                            ->where('fiscal_year', date('Y', strtotime($pr->created_at ?? now())))
                            ->where('month', date('n', strtotime($pr->created_at ?? now())))
                            ->lockForUpdate()
                            ->first();
                        if ($budget) {
                            $budget->decrement('reserved_amount', $pr->total_estimated_cost);
                        }
                    }
                }
            });

            return response()->json([
                'message' => 'Purchase request rejected.',
                'purchase_request' => $pr->fresh()->load(['items', 'requester', 'approver', 'department', 'category', 'statusHistory'])
            ], 200);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('Reject purchase request failure: ' . $e->getMessage(), [
                'pr_id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['message' => 'An unexpected error occurred. Please try again later.'], 500);
        }
    }
}
