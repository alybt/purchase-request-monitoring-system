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
                $budget    = $dept->departmentBudgets->first();
                $allocated = $budget ? floatval($budget->allocated_amount) : 0;
                $reserved  = $budget ? floatval($budget->reserved_amount)  : 0;
                $spent     = $budget ? floatval($budget->spent_amount)     : 0;
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
            ]);

            $fiscalYear      = $request->input('fiscal_year', now()->year);
            $allocatedAmount = $request->input('allocated_amount');

            $budget = DepartmentBudget::firstOrNew([
                'department_id' => $dept->id,
                'fiscal_year'   => $fiscalYear,
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
    public function budgetSummary()
    {
        try {
            $currentYear = now()->year;

            $budgets = DepartmentBudget::with('department')
                ->where('fiscal_year', $currentYear)
                ->get();

            $totalAllocated = $budgets->sum(fn($b) => floatval($b->allocated_amount));
            $totalReserved  = $budgets->sum(fn($b) => floatval($b->reserved_amount));
            $totalSpent     = $budgets->sum(fn($b) => floatval($b->spent_amount));
            $totalAvailable = $totalAllocated - $totalReserved - $totalSpent;

            $departmentSummaries = $budgets->map(function ($b) use ($totalAllocated) {
                $allocated = floatval($b->allocated_amount);
                return [
                    'department_id' => $b->department_id,
                    'department'    => $b->department?->name ?? 'Unknown',
                    'code'          => $b->department?->code ?? '',
                    'allocated'     => $allocated,
                    'reserved'      => floatval($b->reserved_amount),
                    'spent'         => floatval($b->spent_amount),
                    'available'     => $allocated - floatval($b->reserved_amount) - floatval($b->spent_amount),
                    'percentage'    => $totalAllocated > 0 ? round(($allocated / $totalAllocated) * 100, 1) : 0,
                ];
            });

            return response()->json([
                'fiscal_year'          => $currentYear,
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
}
