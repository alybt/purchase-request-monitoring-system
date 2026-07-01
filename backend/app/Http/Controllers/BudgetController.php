<?php

namespace App\Http\Controllers;

use App\Models\DepartmentBudget;
use App\Models\DepartmentCategoryBudget;
use App\Models\Department;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class BudgetController extends Controller
{
    /**
     * Get the current user's department budget with category breakdown.
     */
    public function myDepartmentBudget(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user->department_id) {
                return response()->json([
                    'department_budget' => null,
                    'category_budgets' => [],
                    'message' => 'No department assigned.',
                ], 200);
            }

            $year = $request->input('fiscal_year', $request->input('fiscalYear', self::getFiscalYear()));
            $month = $request->filled('month') ? (int) $request->input('month') : null;

            // Fetch all 12 months for the year so we can sum annual allocation correctly
            $budgets = DepartmentBudget::with(['departmentCategoryBudgets.category'])
                ->where('department_id', $user->department_id)
                ->where('fiscal_year', $year)
                ->get();

            if ($budgets->isEmpty()) {
                return response()->json([
                    'department_budget' => null,
                    'category_budgets' => [],
                ], 200);
            }

            $annualDeptAllocated = floatval($budgets->sum('allocated_amount'));
            $deptAllocated = self::calculateBudgetForPeriod($annualDeptAllocated, $month);

            if ($month !== null) {
                $deptReserved = floatval($budgets->where('month', $month)->sum('reserved_amount'));
                $deptSpent = floatval($budgets->where('month', $month)->sum('spent_amount'));
            } else {
                $deptReserved = floatval($budgets->sum('reserved_amount'));
                $deptSpent = floatval($budgets->sum('spent_amount'));
            }
            $deptAvailable = $deptAllocated - $deptReserved - $deptSpent;

            // Group category budgets by category_id across the whole year to get annual allocations
            $categoryGroups = [];
            foreach ($budgets as $budget) {
                foreach ($budget->departmentCategoryBudgets as $cb) {
                    $catId = $cb->category_id;
                    if (!isset($categoryGroups[$catId])) {
                        $categoryGroups[$catId] = [
                            'id' => $catId,
                            'category_id' => $catId,
                            'category' => $cb->category?->name ?? 'Unknown',
                            'annual_allocated' => 0.0,
                            'reserved' => 0.0,
                            'spent' => 0.0,
                        ];
                    }
                    $categoryGroups[$catId]['annual_allocated'] += floatval($cb->allocated_amount);
                    
                    if ($month === null || $budget->month === $month) {
                        $categoryGroups[$catId]['reserved'] += floatval($cb->reserved_amount);
                        $categoryGroups[$catId]['spent'] += floatval($cb->spent_amount);
                    }
                }
            }

            $categoryBudgets = collect(array_values($categoryGroups))->map(function ($cb) use ($month) {
                $allocated = self::calculateBudgetForPeriod($cb['annual_allocated'], $month);
                $available = $allocated - $cb['reserved'] - $cb['spent'];
                return [
                    'id' => $cb['id'],
                    'category_id' => $cb['category_id'],
                    'category' => $cb['category'],
                    'allocated' => $allocated,
                    'reserved' => $cb['reserved'],
                    'spent' => $cb['spent'],
                    'available' => $available,
                    'percentage' => $allocated > 0
                        ? round((($cb['reserved'] + $cb['spent']) / $allocated) * 100, 1)
                        : 0,
                ];
            })->toArray();

            return response()->json([
                'department_budget' => [
                    'id' => $budgets->first()->id, // Return first ID just as a reference
                    'fiscal_year' => $budgets->first()->fiscal_year,
                    'allocated' => $deptAllocated,
                    'reserved' => $deptReserved,
                    'spent' => $deptSpent,
                    'available' => $deptAvailable,
                ],
                'category_budgets' => $categoryBudgets,
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Get department budget failure: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['message' => 'An unexpected error occurred.'], 500);
        }
    }

    /**
     * Get category budget info for a specific category (for the user's department).
     */
    public function categoryBudget(Request $request, $categoryId)
    {
        try {
            $user = $request->user();

            if (!$user->department_id) {
                return response()->json(['category_budget' => null], 200);
            }

            $year = $request->input('fiscal_year', $request->input('fiscalYear', self::getFiscalYear()));
            $month = $request->filled('month') ? (int) $request->input('month') : null;

            // Fetch all 12 months for the year
            $budgets = DepartmentBudget::where('department_id', $user->department_id)
                ->where('fiscal_year', $year)
                ->get();

            if ($budgets->isEmpty()) {
                return response()->json(['category_budget' => null], 200);
            }

            $budgetIds = $budgets->pluck('id');

            $cbs = DepartmentCategoryBudget::with('category')
                ->whereIn('department_budget_id', $budgetIds)
                ->where('category_id', $categoryId)
                ->get();

            if ($cbs->isEmpty()) {
                return response()->json(['category_budget' => null], 200);
            }

            $annualAllocated = floatval($cbs->sum('allocated_amount'));
            $allocated = self::calculateBudgetForPeriod($annualAllocated, $month);

            if ($month !== null) {
                $selectedBudget = $budgets->firstWhere('month', $month);
                $selectedBudgetId = $selectedBudget ? $selectedBudget->id : null;
                $selectedCbs = $cbs->where('department_budget_id', $selectedBudgetId);
                
                $reserved = floatval($selectedCbs->sum('reserved_amount'));
                $spent = floatval($selectedCbs->sum('spent_amount'));
            } else {
                $reserved = floatval($cbs->sum('reserved_amount'));
                $spent = floatval($cbs->sum('spent_amount'));
            }

            $available = $allocated - $reserved - $spent;

            return response()->json([
                'category_budget' => [
                    'id' => $cbs->first()->id, // Return first ID as a reference
                    'category_id' => intval($categoryId),
                    'category' => $cbs->first()->category?->name,
                    'allocated' => $allocated,
                    'reserved' => $reserved,
                    'spent' => $spent,
                    'available' => $available,
                ],
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Get category budget failure: ' . $e->getMessage());
            return response()->json(['message' => 'An unexpected error occurred.'], 500);
        }
    }

    public function bulkAllocateCategoryBudget(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user->department_id) {
                return response()->json(['message' => 'No department assigned.'], 403);
            }

            $request->validate([
                'fiscal_year' => 'required|integer',
                'allocations' => 'required|array',
                'allocations.*.category_id' => 'required|integer|exists:categories,id',
                'allocations.*.allocated_amount' => 'required|numeric|min:0',
            ]);

            $fiscalYear = $request->input('fiscal_year');
            $allocations = $request->input('allocations');

            $deptBudgets = DepartmentBudget::where('department_id', $user->department_id)
                ->where('fiscal_year', $fiscalYear)
                ->orderBy('id', 'asc')
                ->get();

            if ($deptBudgets->isEmpty()) {
                return response()->json(['message' => 'No department budget found for this fiscal year. Please contact the administrator.'], 404);
            }

            $totalDeptAllocation = $deptBudgets->sum('allocated_amount');
            $primaryDeptBudget = $deptBudgets->first();

            $totalRequested = collect($allocations)->sum('allocated_amount');

            // Find categories not in the payload but currently allocated, keep their allocation
            $budgetIds = $deptBudgets->pluck('id');
            $existingCatBudgets = DepartmentCategoryBudget::whereIn('department_budget_id', $budgetIds)->get();
            $payloadCatIds = collect($allocations)->pluck('category_id')->toArray();
            
            // Sum up existing allocations for categories NOT in the payload
            $unmodifiedExistingTotal = $existingCatBudgets->whereNotIn('category_id', $payloadCatIds)->sum('allocated_amount');

            if (($totalRequested + $unmodifiedExistingTotal) > $totalDeptAllocation) {
                return response()->json([
                    'message' => 'Total category allocations exceed the department budget limit of ₱' . number_format($totalDeptAllocation, 2),
                ], 422);
            }

            foreach ($allocations as $alloc) {
                $catId = $alloc['category_id'];
                $amount = $alloc['allocated_amount'];

                // Find all existing category budgets for this category across all department budget rows
                $cbs = $existingCatBudgets->where('category_id', $catId);

                if ($cbs->count() > 0) {
                    // Update the first one with the full amount, zero out the rest
                    /** @var DepartmentCategoryBudget $firstCb */
                    $firstCb = $cbs->first();
                    $firstCb->update(['allocated_amount' => $amount]);

                    foreach ($cbs->slice(1) as $extraCb) {
                        /** @var DepartmentCategoryBudget $extraCb */
                        $extraCb->update(['allocated_amount' => 0]);
                    }
                } else {
                    // Create new on the primary department budget
                    DepartmentCategoryBudget::create([
                        'department_budget_id' => $primaryDeptBudget->id,
                        'category_id' => $catId,
                        'allocated_amount' => $amount,
                        'reserved_amount' => 0,
                        'spent_amount' => 0,
                    ]);
                }
            }

            return response()->json(['message' => 'Category budgets allocated successfully.'], 200);
        } catch (\Throwable $e) {
            Log::error('Bulk allocate category budget failure: ' . $e->getMessage());
            return response()->json(['message' => 'An unexpected error occurred.'], 500);
        }
    }
}
