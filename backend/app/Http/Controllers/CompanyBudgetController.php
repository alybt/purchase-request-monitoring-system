<?php

namespace App\Http\Controllers;

use App\Models\CompanyBudget;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class CompanyBudgetController extends Controller
{
    /**
     * List all company budgets.
     */
    public function index()
    {
        try {
            $budgets = CompanyBudget::orderBy('fiscal_year', 'desc')->get();
            return response()->json(['budgets' => $budgets], 200);
        } catch (\Throwable $e) {
            Log::error('List company budgets failure: ' . $e->getMessage());
            return response()->json(['message' => 'An unexpected error occurred.'], 500);
        }
    }

    /**
     * Get the company budget for a specific fiscal year.
     */
    public function show($fiscalYear)
    {
        try {
            $budget = CompanyBudget::where('fiscal_year', $fiscalYear)->first();
            if (!$budget) {
                return response()->json(['message' => 'No budget found for this fiscal year.'], 404);
            }
            return response()->json(['budget' => $budget], 200);
        } catch (\Throwable $e) {
            Log::error('Get company budget failure: ' . $e->getMessage());
            return response()->json(['message' => 'An unexpected error occurred.'], 500);
        }
    }

    /**
     * Create or update a company budget for a fiscal year.
     * Business rule: Only one record per fiscal year — upsert.
     */
    public function upsert(Request $request)
    {
        try {
            $request->validate([
                'fiscal_year'   => 'required|integer|min:2000|max:2100',
                'total_budget'  => 'required|numeric|min:0',
                'carry_forward' => 'nullable|numeric|min:0',
            ]);

            $fiscalYear   = $request->input('fiscal_year');
            $totalBudget  = $request->input('total_budget');
            $carryForward = $request->input('carry_forward', 0);

            $existing = CompanyBudget::where('fiscal_year', $fiscalYear)->first();
            
            if (!$existing) {
                $latestBudgetYear = CompanyBudget::max('fiscal_year');
                $maxAllowedYear = $latestBudgetYear ? $latestBudgetYear + 1 : now()->year + 1;
                
                if ($fiscalYear > $maxAllowedYear) {
                    return response()->json([
                        'message' => "Cannot create budget for FY {$fiscalYear}. You must first create a budget for FY " . ($fiscalYear - 1) . "."
                    ], 422);
                }
            }

            // Validate carry_forward against previous year's remaining balance
            if ($carryForward > 0) {
                $prevYear = $fiscalYear - 1;
                $prevCb = CompanyBudget::where('fiscal_year', $prevYear)->first();
                $prevRem = 0;
                
                if ($prevCb) {
                    $prevSummary = \App\Models\DepartmentBudget::where('fiscal_year', $prevYear)
                        ->selectRaw('SUM(reserved_amount) as reserved, SUM(spent_amount) as spent')
                        ->first();
                        
                    $prevTotal = $prevCb->total_budget + $prevCb->carry_forward;
                    $prevReserved = $prevSummary ? (float)$prevSummary->reserved : 0;
                    $prevSpent = $prevSummary ? (float)$prevSummary->spent : 0;
                    
                    $prevRem = max(0, $prevTotal - $prevReserved - $prevSpent);
                }

                if ($carryForward > $prevRem) {
                    return response()->json([
                        'message' => "Carry forward (₱" . number_format($carryForward, 2) . ") cannot exceed previous year's remaining balance (₱" . number_format($prevRem, 2) . ")."
                    ], 422);
                }
            }

            $budget = CompanyBudget::firstOrNew(['fiscal_year' => $fiscalYear]);
            $budget->total_budget = $totalBudget;
            $budget->carry_forward = $carryForward;
            // Keep allocated_amount as-is if record already exists; initialize to 0 for new records
            if (!$budget->exists) {
                $budget->allocated_amount = 0;
            }
            $budget->save();

            return response()->json([
                'message' => $budget->wasRecentlyCreated
                    ? 'Company budget created successfully.'
                    : 'Company budget updated successfully.',
                'budget' => $budget->fresh(),
            ], 200);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('Upsert company budget failure: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['message' => 'An unexpected error occurred.'], 500);
        }
    }

    /**
     * Delete a company budget for a fiscal year.
     */
    public function destroy($fiscalYear)
    {
        try {
            $budget = CompanyBudget::where('fiscal_year', $fiscalYear)->first();
            if (!$budget) {
                return response()->json(['message' => 'No budget found for this fiscal year.'], 404);
            }
            $budget->delete();
            return response()->json(['message' => 'Company budget deleted successfully.'], 200);
        } catch (\Throwable $e) {
            Log::error('Delete company budget failure: ' . $e->getMessage());
            return response()->json(['message' => 'An unexpected error occurred.'], 500);
        }
    }
}
