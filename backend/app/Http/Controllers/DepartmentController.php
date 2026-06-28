<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\DepartmentBudget;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class DepartmentController extends Controller
{
    public function index()
    {
        try {
            $currentYear = now()->year;

            $departments = Department::with([
                'departmentBudgets' => function ($q) use ($currentYear) {
                    $q->where('fiscal_year', $currentYear);
                }
            ])->orderBy('name')->get();

            $mapped = $departments->map(function ($dept) use ($currentYear) {
                $allocated = floatval($dept->departmentBudgets->sum('allocated_amount'));
                $reserved  = floatval($dept->departmentBudgets->sum('reserved_amount'));
                $spent     = floatval($dept->departmentBudgets->sum('spent_amount'));
                $available = $allocated - $reserved - $spent;

                return [
                    'id'                => $dept->id,
                    'name'              => $dept->name,
                    'code'              => $dept->code,
                    'description'       => $dept->description,
                    'budget_allocation' => $allocated,
                    'available_budget'  => $available,
                    'reserved_budget'   => $reserved,
                    'spent_budget'      => $spent,
                    'fiscal_year'       => $currentYear,
                ];
            });

            return response()->json(['departments' => $mapped], 200);
        } catch (\Throwable $e) {
            Log::error('List departments failure: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['message' => 'An unexpected error occurred.'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'name'        => 'required|string|max:255',
                'code'        => 'required|string|max:20|unique:departments,code',
                'description' => 'nullable|string',
            ]);

            $dept = Department::create([
                'name'        => $request->input('name'),
                'code'        => strtoupper($request->input('code')),
                'description' => $request->input('description'),
            ]);

            return response()->json([
                'message'    => 'Department created successfully.',
                'department' => $dept,
            ], 201);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('Create department failure: ' . $e->getMessage());
            return response()->json(['message' => 'An unexpected error occurred.'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $dept = Department::find($id);
            if (!$dept) {
                return response()->json(['message' => 'Department not found.'], 404);
            }

            $request->validate([
                'name'        => 'sometimes|required|string|max:255',
                'code'        => 'sometimes|required|string|max:20|unique:departments,code,' . $id,
                'description' => 'nullable|string',
            ]);

            $dept->update($request->only(['name', 'code', 'description']));

            return response()->json([
                'message'    => 'Department updated successfully.',
                'department' => $dept,
            ], 200);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('Update department failure: ' . $e->getMessage());
            return response()->json(['message' => 'An unexpected error occurred.'], 500);
        }
    }

    /**
     * Update (or create) a department's budget allocation for the given fiscal year.
     * Uses upsert logic — creates the DepartmentBudget row if it does not yet exist.
     */
    public function updateBudget(Request $request, $departmentId)
    {
        try {
            $dept = Department::find($departmentId);
            if (!$dept) {
                return response()->json(['message' => 'Department not found.'], 404);
            }

            $request->validate([
                'allocated_amount' => 'required|numeric|min:0',
                'fiscal_year'      => 'nullable|integer|min:2000|max:2100',
                'month'            => 'nullable|integer|min:1|max:12',
            ]);

            $fiscalYear      = $request->input('fiscal_year', now()->year);
            $month           = $request->input('month', now()->month);
            $allocatedAmount = $request->input('allocated_amount');

            $budget = DepartmentBudget::firstOrNew([
                'department_id' => $dept->id,
                'fiscal_year'   => $fiscalYear,
                'month'         => $month,
            ]);

            // Guard: cannot set below already reserved + spent
            $minAllowed = floatval($budget->reserved_amount ?? 0) + floatval($budget->spent_amount ?? 0);
            if ($allocatedAmount < $minAllowed) {
                return response()->json([
                    'message' => 'Allocated amount cannot be less than the already reserved + spent amount (₱' . number_format($minAllowed, 2) . ').',
                ], 422);
            }

            $budget->allocated_amount = $allocatedAmount;
            if (!$budget->exists) {
                $budget->reserved_amount = 0;
                $budget->spent_amount    = 0;
            }
            $budget->save();

            $available = floatval($budget->allocated_amount)
                - floatval($budget->reserved_amount)
                - floatval($budget->spent_amount);

            return response()->json([
                'message' => 'Budget updated successfully.',
                'budget'  => [
                    'department_id' => $dept->id,
                    'department'    => $dept->name,
                    'code'          => $dept->code,
                    'fiscal_year'   => (int) $fiscalYear,
                    'month'         => (int) $month,
                    'allocated'     => floatval($budget->allocated_amount),
                    'reserved'      => floatval($budget->reserved_amount),
                    'spent'         => floatval($budget->spent_amount),
                    'available'     => $available,
                ],
            ], 200);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('Update department budget failure: ' . $e->getMessage(), [
                'department_id' => $departmentId,
                'trace'         => $e->getTraceAsString(),
            ]);
            return response()->json(['message' => 'An unexpected error occurred.'], 500);
        }
    }

    /**
     * Get all departments with their budget summary for the admin budget page.
     */
    public function budgetSummary(Request $request)
    {
        try {
            $currentYear = $request->input('fiscal_year', now()->year);

            $budgets = DepartmentBudget::with('department')
                ->where('fiscal_year', $currentYear)
                ->get();

            // Group by department
            $grouped = $budgets->groupBy('department_id');

            $totalAllocated = $budgets->sum(fn($b) => floatval($b->allocated_amount));
            $totalReserved  = $budgets->sum(fn($b) => floatval($b->reserved_amount));
            $totalSpent     = $budgets->sum(fn($b) => floatval($b->spent_amount));
            $totalAvailable = $totalAllocated - $totalReserved - $totalSpent;

            $departmentSummaries = $grouped->map(function ($deptBudgets, $deptId) use ($totalAllocated) {
                $first = $deptBudgets->first();
                $allocated = $deptBudgets->sum(fn($b) => floatval($b->allocated_amount));
                $reserved  = $deptBudgets->sum(fn($b) => floatval($b->reserved_amount));
                $spent     = $deptBudgets->sum(fn($b) => floatval($b->spent_amount));
                
                return [
                    'department_id' => $deptId,
                    'department'    => $first->department?->name ?? 'Unknown',
                    'code'          => $first->department?->code ?? '',
                    'allocated'     => $allocated,
                    'reserved'      => $reserved,
                    'spent'         => $spent,
                    'available'     => $allocated - $reserved - $spent,
                    'percentage'    => $totalAllocated > 0 ? round(($allocated / $totalAllocated) * 100, 1) : 0,
                ];
            })->values();

            return response()->json([
                'fiscal_year'          => (int) $currentYear,
                'total_allocated'      => $totalAllocated,
                'total_reserved'       => $totalReserved,
                'total_spent'          => $totalSpent,
                'total_available'      => $totalAvailable,
                'department_summaries' => $departmentSummaries,
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Budget summary failure: ' . $e->getMessage());
            return response()->json(['message' => 'An unexpected error occurred.'], 500);
        }
    }

    /**
     * Get detailed calculations for a department budget (last 12 months, for the year, and by quarters).
     */
    public function budgetCalculations(Request $request, $departmentId)
    {
        try {
            $dept = Department::find($departmentId);
            if (!$dept) {
                return response()->json(['message' => 'Department not found.'], 404);
            }

            $year = $request->input('fiscal_year', now()->year);
            $currentMonth = now()->month;

            // 1. Last 12 months (rolling) calculations
            $endPeriod = $year * 12 + $currentMonth;
            $startPeriod = $endPeriod - 11;

            $last12MonthsQuery = DepartmentBudget::where('department_id', $departmentId)
                ->whereRaw('(fiscal_year * 12 + month) >= ?', [$startPeriod])
                ->whereRaw('(fiscal_year * 12 + month) <= ?', [$endPeriod]);

            $allocatedL12 = floatval($last12MonthsQuery->sum('allocated_amount'));
            $reservedL12  = floatval($last12MonthsQuery->sum('reserved_amount'));
            $spentL12     = floatval($last12MonthsQuery->sum('spent_amount'));

            $last12 = [
                'allocated' => $allocatedL12,
                'reserved'  => $reservedL12,
                'spent'     => $spentL12,
                'available' => $allocatedL12 - $reservedL12 - $spentL12,
            ];

            // 2. For the year
            $yearQuery = DepartmentBudget::where('department_id', $departmentId)
                ->where('fiscal_year', $year);

            $allocatedYr = floatval($yearQuery->sum('allocated_amount'));
            $reservedYr  = floatval($yearQuery->sum('reserved_amount'));
            $spentYr     = floatval($yearQuery->sum('spent_amount'));

            $forYear = [
                'allocated' => $allocatedYr,
                'reserved'  => $reservedYr,
                'spent'     => $spentYr,
                'available' => $allocatedYr - $reservedYr - $spentYr,
            ];

            // 3. By quarter: 1-4, 4-6, 7-9, 10-12 (as requested, and standard Q1-Q4)
            $quarters = [];
            $quarterRanges = [
                'q1_standard' => [1, 3],
                'q1_user'     => [1, 4],  // 1-4
                'q2_user'     => [4, 6],  // 4-6
                'q3_user'     => [7, 9],  // 7-9
                'q4_user'     => [10, 12], // 10-12
            ];

            foreach ($quarterRanges as $key => $range) {
                $qQuery = DepartmentBudget::where('department_id', $departmentId)
                    ->where('fiscal_year', $year)
                    ->whereBetween('month', $range);

                $allocQ = floatval($qQuery->sum('allocated_amount'));
                $resQ   = floatval($qQuery->sum('reserved_amount'));
                $spQ    = floatval($qQuery->sum('spent_amount'));

                $quarters[$key] = [
                    'allocated' => $allocQ,
                    'reserved'  => $resQ,
                    'spent'     => $spQ,
                    'available' => $allocQ - $resQ - $spQ,
                ];
            }

            return response()->json([
                'department_id'   => $dept->id,
                'department_name' => $dept->name,
                'fiscal_year'     => (int) $year,
                'calculations'    => [
                    'last_12_months' => $last12,
                    'for_year'       => $forYear,
                    'quarters'       => $quarters,
                ],
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Get department budget calculations failure: ' . $e->getMessage(), [
                'department_id' => $departmentId,
                'trace'         => $e->getTraceAsString(),
            ]);
            return response()->json(['message' => 'An unexpected error occurred.'], 500);
        }
    }
}
