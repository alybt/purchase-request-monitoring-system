<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\DepartmentBudget;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class DepartmentController extends Controller
{
    public function index(Request $request)
    {
        try {
            $currentYear = $request->input('fiscal_year', $request->input('fiscalYear', self::getFiscalYear()));
            $month = $request->filled('month') ? (int) $request->input('month') : null;

            $companyBudget = \App\Models\CompanyBudget::where('fiscal_year', $currentYear)->first();
            $annualCompanyBudget = $companyBudget ? floatval($companyBudget->total_budget) + floatval($companyBudget->carry_forward) : 0.0;
            $totalCompanyBudget = self::calculateBudgetForPeriod($annualCompanyBudget, $month);

            $departments = Department::with([
                'departmentBudgets' => function ($q) use ($currentYear) {
                    $q->where('fiscal_year', $currentYear);
                }
            ])->orderBy('name')->get();

            $mapped = $departments->map(function ($dept) use ($month, $totalCompanyBudget) {
                $deptBudgets = $dept->departmentBudgets;
                $hasAllocation = $deptBudgets->count() > 0;

                $annualAllocated = floatval($deptBudgets->sum('allocated_amount'));
                $allocated = self::calculateBudgetForPeriod($annualAllocated, $month);

                if ($month !== null) {
                    $reserved = floatval($deptBudgets->where('month', $month)->sum('reserved_amount'));
                    $spent = floatval($deptBudgets->where('month', $month)->sum('spent_amount'));
                } else {
                    $reserved = floatval($deptBudgets->sum('reserved_amount'));
                    $spent = floatval($deptBudgets->sum('spent_amount'));
                }
                $available = $allocated - $reserved - $spent;
                $share = $totalCompanyBudget > 0 ? ($allocated / $totalCompanyBudget) * 100 : 0;

                return [
                    'id' => $dept->id,
                    'name' => $dept->name,
                    'code' => $dept->code,
                    'description' => $dept->description,
                    'status' => $dept->status ?? 'active',
                    'has_allocation' => $hasAllocation,
                    'budget_allocation' => $allocated,
                    'available_budget' => $available,
                    'reserved_budget' => $reserved,
                    'spent_budget' => $spent,
                    'share' => $share,
                    'fiscal_year' => $deptBudgets->first()?->fiscal_year,
                ];
            });

            return response()->json([
                'departments' => $mapped,
                'total_company_budget' => $totalCompanyBudget,
                'fiscal_year' => (int) $currentYear,
                'month' => $month,
            ], 200);
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
                'name' => 'required|string|max:255',
                'code' => 'required|string|max:20|unique:departments,code',
                'description' => 'nullable|string',
                'status' => 'nullable|string|in:active,inactive',
                'head_id' => 'nullable|exists:users,id',
            ]);

            $dept = Department::create([
                'name' => $request->input('name'),
                'code' => strtoupper($request->input('code')),
                'description' => $request->input('description'),
                'status' => $request->input('status', 'active'),
                'head_id' => $request->input('head_id'),
            ]);

            return response()->json([
                'message' => 'Department created successfully.',
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
                'name' => 'sometimes|required|string|max:255',
                'code' => 'sometimes|required|string|max:20|unique:departments,code,' . $id,
                'description' => 'nullable|string',
                'status' => 'nullable|string|in:active,inactive',
                'head_id' => 'nullable|exists:users,id',
            ]);

            $dept->update($request->only(['name', 'code', 'description', 'status', 'head_id']));

            return response()->json([
                'message' => 'Department updated successfully.',
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
                'fiscal_year' => 'nullable|integer|min:2000|max:2100',
                'month' => 'nullable|integer|min:1|max:12',
            ]);

            $fiscalYear = $request->input('fiscal_year', self::getFiscalYear());
            $month = $request->input('month', now()->month);
            $allocatedAmount = $request->input('allocated_amount');

            $budget = DepartmentBudget::firstOrNew([
                'department_id' => $dept->id,
                'fiscal_year' => $fiscalYear,
                'month' => $month,
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
                $budget->spent_amount = 0;
            }
            $budget->save();

            $available = floatval($budget->allocated_amount)
                - floatval($budget->reserved_amount)
                - floatval($budget->spent_amount);

            return response()->json([
                'message' => 'Budget updated successfully.',
                'budget' => [
                    'department_id' => $dept->id,
                    'department' => $dept->name,
                    'code' => $dept->code,
                    'fiscal_year' => (int) $fiscalYear,
                    'month' => (int) $month,
                    'allocated' => floatval($budget->allocated_amount),
                    'reserved' => floatval($budget->reserved_amount),
                    'spent' => floatval($budget->spent_amount),
                    'available' => $available,
                ],
            ], 200);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('Update department budget failure: ' . $e->getMessage(), [
                'department_id' => $departmentId,
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['message' => 'An unexpected error occurred.'], 500);
        }
    }

    /**
     * Bulk allocate budget for multiple departments for a given fiscal year.
     */
    public function bulkAllocateBudget(Request $request)
    {
        try {
            // 2 & 3: Validate allocation values are numeric and not negative
            $request->validate([
                'fiscal_year' => 'required|integer',
                'allocations' => 'required|array',
                'allocations.*.department_id' => 'required|integer|exists:departments,id',
                'allocations.*.allocated_amount' => 'required|numeric|min:0',
            ]);

            $fiscalYear = $request->input('fiscal_year');
            $allocations = $request->input('allocations');

            // 1. Validate Company Budget exists
            $companyBudget = \App\Models\CompanyBudget::where('fiscal_year', $fiscalYear)->first();
            if (!$companyBudget) {
                return response()->json(['message' => "Company budget for FY {$fiscalYear} has not been created yet."], 422);
            }

            $totalCompanyBudget = floatval($companyBudget->total_budget) + floatval($companyBudget->carry_forward);

            // 4. Calculate Total Allocated (including those not in payload but existing in DB)
            $requestedTotal = array_reduce($allocations, function ($carry, $item) {
                return $carry + floatval($item['allocated_amount']);
            }, 0);

            $departmentIdsInPayload = array_column($allocations, 'department_id');
            $otherAllocationsTotal = DepartmentBudget::where('fiscal_year', $fiscalYear)
                ->whereNotIn('department_id', $departmentIdsInPayload)
                ->sum('allocated_amount');

            $totalAllocated = $requestedTotal + floatval($otherAllocationsTotal);

            // 5. If Total Allocated > Company Budget, reject the request with a validation error
            if ($totalAllocated > $totalCompanyBudget) {
                return response()->json([
                    'message' => 'Total department allocations cannot exceed the Company Budget limit.'
                ], 422);
            }

            \DB::beginTransaction();

            $updatedCount = 0;
            // 6. Save the exact allocation values received from the client
            foreach ($allocations as $alloc) {
                $deptId = $alloc['department_id'];
                $amount = floatval($alloc['allocated_amount']);

                $existingRecords = DepartmentBudget::where('department_id', $deptId)
                    ->where('fiscal_year', $fiscalYear)
                    ->get();

                if ($existingRecords->count() > 0) {
                    // Update the first record with the full amount
                    $firstRecord = $existingRecords->first();
                    $firstRecord->allocated_amount = $amount;
                    $firstRecord->save();

                    // Zero out any other existing monthly records for this FY to prevent massive inflated SUMs
                    foreach ($existingRecords->slice(1) as $extraRecord) {
                        $extraRecord->allocated_amount = 0;
                        $extraRecord->save();
                    }
                } else {
                    // Only create if absolutely no records exist for this FY
                    $budget = new DepartmentBudget();
                    $budget->department_id = $deptId;
                    $budget->fiscal_year = $fiscalYear;
                    $budget->month = 1;
                    $budget->allocated_amount = $amount;
                    $budget->reserved_amount = 0;
                    $budget->spent_amount = 0;
                    $budget->save();
                }
                $updatedCount++;
            }

            // Sync the company budget's allocated amount tracker to accurately reflect the database
            $companyBudget->allocated_amount = DepartmentBudget::where('fiscal_year', $fiscalYear)->sum('allocated_amount');
            $companyBudget->save();

            \DB::commit();

            // 7. Return the saved records (success message)
            return response()->json([
                'message' => "Successfully allocated budget to {$updatedCount} departments."
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['message' => $e->getMessage(), 'errors' => $e->errors()], 422);
        } catch (\Throwable $e) {
            \DB::rollBack();
            Log::error('Bulk allocate budget failure: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'An unexpected error occurred.'], 500);
        }
    }
    /**
     * Get all departments with their budget summary for the admin budget page.
     */
    public function budgetSummary(Request $request)
    {
        try {
            $currentYear = $request->input('fiscal_year', $request->input('fiscalYear', self::getFiscalYear()));
            $month = $request->filled('month') ? (int) $request->input('month') : null;

            $departments = Department::with([
                'departmentBudgets' => function ($q) use ($currentYear) {
                    $q->where('fiscal_year', $currentYear);
                }
            ])->orderBy('name')->get();

            $companyBudget = \App\Models\CompanyBudget::where('fiscal_year', $currentYear)->first();
            $annualCompanyBudget = $companyBudget ? (floatval($companyBudget->total_budget) + floatval($companyBudget->carry_forward)) : 0.0;
            $totalCompanyBudget = self::calculateBudgetForPeriod($annualCompanyBudget, $month);

            $departmentSummaries = $departments->map(function ($dept) use ($month) {
                $deptBudgets = $dept->departmentBudgets;

                $annualAllocated = floatval($deptBudgets->sum('allocated_amount'));
                $allocated = self::calculateBudgetForPeriod($annualAllocated, $month);

                if ($month !== null) {
                    $reserved = floatval($deptBudgets->where('month', $month)->sum('reserved_amount'));
                    $spent = floatval($deptBudgets->where('month', $month)->sum('spent_amount'));
                } else {
                    $reserved = floatval($deptBudgets->sum('reserved_amount'));
                    $spent = floatval($deptBudgets->sum('spent_amount'));
                }

                $monthlyBreakdown = [];
                for ($m = 1; $m <= 12; $m++) {
                    $mBudget = $deptBudgets->firstWhere('month', $m);
                    // Standard monthly allocation is annual / 12
                    $allocM = self::calculateBudgetForPeriod($annualAllocated, $m);
                    $resM = $mBudget ? floatval($mBudget->reserved_amount) : 0.0;
                    $spM = $mBudget ? floatval($mBudget->spent_amount) : 0.0;
                    $monthlyBreakdown[] = [
                        'month' => $m,
                        'allocated' => $allocM,
                        'reserved' => $resM,
                        'spent' => $spM,
                        'available' => $allocM - $resM - $spM,
                    ];
                }

                return [
                    'department_id' => $dept->id,
                    'department' => $dept->name,
                    'code' => $dept->code,
                    'status' => $dept->status,
                    'allocated' => $allocated,
                    'reserved' => $reserved,
                    'spent' => $spent,
                    'available' => $allocated - $reserved - $spent,
                    'monthly_breakdown' => $monthlyBreakdown,
                ];
            })->values();

            $totalAllocated = $departmentSummaries->sum('allocated');
            $totalReserved = $departmentSummaries->sum('reserved');
            $totalSpent = $departmentSummaries->sum('spent');
            $totalAvailable = $totalAllocated - $totalReserved - $totalSpent;

            $departmentSummaries = $departmentSummaries->map(function ($summary) use ($totalCompanyBudget) {
                $summary['percentage'] = $totalCompanyBudget > 0 ? round(($summary['allocated'] / $totalCompanyBudget) * 100, 2) : 0;
                return $summary;
            });

            return response()->json([
                'fiscal_year' => (int) $currentYear,
                'month' => $month,
                'total_allocated' => $totalAllocated,
                'total_reserved' => $totalReserved,
                'total_spent' => $totalSpent,
                'total_available' => $totalAvailable,
                'total_company_budget' => $totalCompanyBudget,
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

            $year = $request->input('fiscal_year', self::getFiscalYear());
            $currentMonth = now()->month;

            // 1. Last 12 months (rolling) calculations
            $endPeriod = $year * 12 + $currentMonth;
            $startPeriod = $endPeriod - 11;

            $last12MonthsQuery = DepartmentBudget::where('department_id', $departmentId)
                ->whereRaw('(fiscal_year * 12 + month) >= ?', [$startPeriod])
                ->whereRaw('(fiscal_year * 12 + month) <= ?', [$endPeriod]);

            $allocatedL12 = floatval($last12MonthsQuery->sum('allocated_amount'));
            $reservedL12 = floatval($last12MonthsQuery->sum('reserved_amount'));
            $spentL12 = floatval($last12MonthsQuery->sum('spent_amount'));

            $last12 = [
                'allocated' => $allocatedL12,
                'reserved' => $reservedL12,
                'spent' => $spentL12,
                'available' => $allocatedL12 - $reservedL12 - $spentL12,
            ];

            // 2. For the year
            $yearQuery = DepartmentBudget::where('department_id', $departmentId)
                ->where('fiscal_year', $year);

            $allocatedYr = floatval($yearQuery->sum('allocated_amount'));
            $reservedYr = floatval($yearQuery->sum('reserved_amount'));
            $spentYr = floatval($yearQuery->sum('spent_amount'));

            $forYear = [
                'allocated' => $allocatedYr,
                'reserved' => $reservedYr,
                'spent' => $spentYr,
                'available' => $allocatedYr - $reservedYr - $spentYr,
            ];

            // 3. By quarter: 1-4, 4-6, 7-9, 10-12 (as requested, and standard Q1-Q4)
            $quarters = [];
            $quarterRanges = [
                'q1_standard' => [1, 3],
                'q1_user' => [1, 4],  // 1-4
                'q2_user' => [4, 6],  // 4-6
                'q3_user' => [7, 9],  // 7-9
                'q4_user' => [10, 12], // 10-12
            ];

            foreach ($quarterRanges as $key => $range) {
                $qQuery = DepartmentBudget::where('department_id', $departmentId)
                    ->where('fiscal_year', $year)
                    ->whereBetween('month', $range);

                $allocQ = floatval($qQuery->sum('allocated_amount'));
                $resQ = floatval($qQuery->sum('reserved_amount'));
                $spQ = floatval($qQuery->sum('spent_amount'));

                $quarters[$key] = [
                    'allocated' => $allocQ,
                    'reserved' => $resQ,
                    'spent' => $spQ,
                    'available' => $allocQ - $resQ - $spQ,
                ];
            }

            return response()->json([
                'department_id' => $dept->id,
                'department_name' => $dept->name,
                'fiscal_year' => (int) $year,
                'calculations' => [
                    'last_12_months' => $last12,
                    'for_year' => $forYear,
                    'quarters' => $quarters,
                ],
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Get department budget calculations failure: ' . $e->getMessage(), [
                'department_id' => $departmentId,
                'trace' => $e->getTraceAsString(),
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
                'ids' => 'required|array',
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
            $fiscalYear = $request->input('fiscal_year', self::getFiscalYear());
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
                'ids' => 'required|array',
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
