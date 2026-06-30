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
            $month = $request->filled('month') ? (int) $request->input('month') : null;

            $departments = Department::with([
                'departmentBudgets' => function ($q) use ($currentYear) {
                    $q->where('fiscal_year', $currentYear);
                }
            ])->orderBy('name')->get();

            $departmentSummaries = $departments->map(function ($dept) use ($month) {
                $deptBudgets = $dept->departmentBudgets;

                $activeBudgets = ($month !== null)
                    ? $deptBudgets->where('month', $month)
                    : $deptBudgets;

                $allocated = floatval($activeBudgets->sum('allocated_amount'));
                $reserved  = floatval($activeBudgets->sum('reserved_amount'));
                $spent     = floatval($activeBudgets->sum('spent_amount'));

                $monthlyBreakdown = [];
                for ($m = 1; $m <= 12; $m++) {
                    $mBudget = $deptBudgets->firstWhere('month', $m);
                    $allocM = $mBudget ? floatval($mBudget->allocated_amount) : 0.0;
                    $resM   = $mBudget ? floatval($mBudget->reserved_amount) : 0.0;
                    $spM    = $mBudget ? floatval($mBudget->spent_amount) : 0.0;
                    $monthlyBreakdown[] = [
                        'month'     => $m,
                        'allocated' => $allocM,
                        'reserved'  => $resM,
                        'spent'     => $spM,
                        'available' => $allocM - $resM - $spM,
                    ];
                }

                return [
                    'department_id'     => $dept->id,
                    'department'        => $dept->name,
                    'code'              => $dept->code,
                    'allocated'         => $allocated,
                    'reserved'          => $reserved,
                    'spent'             => $spent,
                    'available'         => $allocated - $reserved - $spent,
                    'monthly_breakdown' => $monthlyBreakdown,
                ];
            })->values();

            $totalAllocated = $departmentSummaries->sum('allocated');
            $totalReserved  = $departmentSummaries->sum('reserved');
            $totalSpent     = $departmentSummaries->sum('spent');
            $totalAvailable = $totalAllocated - $totalReserved - $totalSpent;

            $departmentSummaries = $departmentSummaries->map(function ($summary) use ($totalAllocated) {
                $summary['percentage'] = $totalAllocated > 0 ? round(($summary['allocated'] / $totalAllocated) * 100, 1) : 0;
                return $summary;
            });

            return response()->json([
                'fiscal_year'          => (int) $currentYear,
                'month'                => $month,
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

    public function destroy($id)
    {
        try {
            $dept = Department::find($id);
            if (!$dept) {
                return response()->json(['message' => 'Department not found.'], 404);
            }

            // Optional: Check if department has users or budgets before deleting
            // and prevent deletion if there are related records
            if ($dept->users()->exists()) {
                return response()->json(['message' => 'Cannot delete department with assigned users.'], 400);
            }

            $dept->delete();

            return response()->json(['message' => 'Department deleted successfully.'], 200);
        } catch (\Throwable $e) {
            Log::error('Delete department failure: ' . $e->getMessage());
            return response()->json(['message' => 'An unexpected error occurred.'], 500);
        }
    }

    public function bulkDestroy(Request $request)
    {
        try {
            $request->validate([
                'ids'   => 'required|array',
                'ids.*' => 'integer|exists:departments,id',
            ]);

            $ids = $request->input('ids');
            
            // Check for relations before bulk deleting
            $departments = Department::whereIn('id', $ids)->get();
            $undeletable = [];
            $deletable = [];

            foreach ($departments as $dept) {
                if ($dept->users()->exists()) {
                    $undeletable[] = $dept->name;
                } else {
                    $deletable[] = $dept->id;
                }
            }

            if (!empty($deletable)) {
                Department::whereIn('id', $deletable)->delete();
            }

            if (!empty($undeletable)) {
                return response()->json([
                    'message' => 'Some departments could not be deleted because they have assigned users: ' . implode(', ', $undeletable),
                ], 400);
            }

            return response()->json(['message' => 'Departments deleted successfully.'], 200);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('Bulk delete departments failure: ' . $e->getMessage());
            return response()->json(['message' => 'An unexpected error occurred.'], 500);
        }
    }

    public function destroyBudget(Request $request, $id)
    {
        try {
            $fiscalYear = $request->input('fiscal_year', now()->year);
            $month = $request->filled('month') ? (int) $request->input('month') : null;

            $query = DepartmentBudget::where('department_id', $id)
                ->where('fiscal_year', $fiscalYear);
            
            if ($month) {
                $query->where('month', $month);
            }

            // check if there's spent/reserved budget before deleting/resetting?
            // "Delete" here means setting allocated_amount to 0, or just deleting the record if no spent/reserved.
            $budgets = $query->get();

            foreach ($budgets as $budget) {
                if ($budget->reserved_amount > 0 || $budget->spent_amount > 0) {
                    $budget->allocated_amount = $budget->reserved_amount + $budget->spent_amount;
                    $budget->save();
                } else {
                    $budget->delete();
                }
            }

            return response()->json(['message' => 'Budget reset successfully.'], 200);
        } catch (\Throwable $e) {
            Log::error('Delete department budget failure: ' . $e->getMessage());
            return response()->json(['message' => 'An unexpected error occurred.'], 500);
        }
    }

    public function bulkDestroyBudget(Request $request)
    {
        try {
            $request->validate([
                'ids'   => 'required|array',
                'ids.*' => 'integer|exists:departments,id',
                'fiscal_year' => 'required|integer',
                'month' => 'nullable|integer',
            ]);

            $ids = $request->input('ids');
            $fiscalYear = $request->input('fiscal_year');
            $month = $request->filled('month') ? (int) $request->input('month') : null;

            $query = DepartmentBudget::whereIn('department_id', $ids)
                ->where('fiscal_year', $fiscalYear);
            
            if ($month) {
                $query->where('month', $month);
            }

            $budgets = $query->get();
            $cantDeleteFull = [];

            foreach ($budgets as $budget) {
                if ($budget->reserved_amount > 0 || $budget->spent_amount > 0) {
                    $budget->allocated_amount = $budget->reserved_amount + $budget->spent_amount;
                    $budget->save();
                    $cantDeleteFull[] = $budget->department_id;
                } else {
                    $budget->delete();
                }
            }

            return response()->json(['message' => 'Budgets deleted/reset successfully.'], 200);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('Bulk delete department budgets failure: ' . $e->getMessage());
            return response()->json(['message' => 'An unexpected error occurred.'], 500);
        }
    }
}
