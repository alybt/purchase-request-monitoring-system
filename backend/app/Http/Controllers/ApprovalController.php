<?php

namespace App\Http\Controllers;

use App\Models\PurchaseRequest;
use App\Models\ApprovalForm;
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
                return response()->json([
                    'message' => 'Purchase request not found.'
                ], 404);
            }

            $request->validate([
                'comments' => 'nullable|string',
            ]);

            $user = $request->user();

            DB::transaction(function () use ($pr, $user, $request) {
                $pr->update(['status' => 'Approve']);

                ApprovalForm::create([
                    'pr_id' => $pr->id,
                    'approver_id' => $user->id,
                    'status' => 'Approve',
                    'comments' => $request->input('comments'),
                    'action_date' => now(),
                ]);
            });

            return response()->json([
                'message' => 'Purchase request approved successfully.',
                'purchase_request' => $pr->load(['lineItems', 'approvals.approver'])
            ], 200);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('Approve purchase request failure: ' . $e->getMessage(), [
                'pr_id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An unexpected error occurred. Please try again later.'
            ], 500);
        }
    }

    public function reject(Request $request, $id)
    {
        try {
            $pr = PurchaseRequest::find($id);

            if (!$pr) {
                return response()->json([
                    'message' => 'Purchase request not found.'
                ], 404);
            }

            $request->validate([
                'comments' => 'nullable|string',
            ]);

            $user = $request->user();

            DB::transaction(function () use ($pr, $user, $request) {
                // Status ENUM is ['Request', 'Approve', 'Released', 'Received']
                // Since there's no 'Rejected' or 'Reject' state in the ENUM on purchase_requests,
                // we leave the status of the PR unchanged.
                // But we register the rejection in the approval_form table.
                ApprovalForm::create([
                    'pr_id' => $pr->id,
                    'approver_id' => $user->id,
                    'status' => 'Reject',
                    'comments' => $request->input('comments'),
                    'action_date' => now(),
                ]);
            });

            return response()->json([
                'message' => 'Purchase request rejected successfully.',
                'purchase_request' => $pr->load(['lineItems', 'approvals.approver'])
            ], 200);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('Reject purchase request failure: ' . $e->getMessage(), [
                'pr_id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An unexpected error occurred. Please try again later.'
            ], 500);
        }
    }
}
