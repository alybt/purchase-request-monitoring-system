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

            $budget = DepartmentBudget::with(['departmentCategoryBudgets.category'])
                ->where('department_id', $user->department_id)
                ->where('fiscal_year', now()->year)
                ->first();

            if (!$budget) {
                return response()->json([
                    'department_budget' => null,
                    'category_budgets' => [],
                ], 200);
            }

            $availableAmount = floatval($budget->allocated_amount)
                - floatval($budget->reserved_amount)
                - floatval($budget->spent_amount);

            $categoryBudgets = $budget->departmentCategoryBudgets->map(function ($cb) {
                $available = floatval($cb->allocated_amount)
                    - floatval($cb->reserved_amount)
                    - floatval($cb->spent_amount);
                return [
                    'id' => $cb->id,
                    'category_id' => $cb->category_id,
                    'category' => $cb->category?->name ?? 'Unknown',
                    'allocated' => floatval($cb->allocated_amount),
                    'reserved' => floatval($cb->reserved_amount),
                    'spent' => floatval($cb->spent_amount),
                    'available' => $available,
                    'percentage' => $cb->allocated_amount > 0
                        ? round(($available / floatval($cb->allocated_amount)) * 100, 1)
                        : 0,
                ];
            });

            return response()->json([
                'department_budget' => [
                    'id' => $budget->id,
                    'fiscal_year' => $budget->fiscal_year,
                    'allocated' => floatval($budget->allocated_amount),
                    'reserved' => floatval($budget->reserved_amount),
                    'spent' => floatval($budget->spent_amount),
                    'available' => $availableAmount,
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

            $budget = DepartmentBudget::where('department_id', $user->department_id)
                ->where('fiscal_year', now()->year)
                ->first();

            if (!$budget) {
                return response()->json(['category_budget' => null], 200);
            }

            $cb = DepartmentCategoryBudget::with('category')
                ->where('department_budget_id', $budget->id)
                ->where('category_id', $categoryId)
                ->first();

            if (!$cb) {
                return response()->json(['category_budget' => null], 200);
            }

            $available = floatval($cb->allocated_amount)
                - floatval($cb->reserved_amount)
                - floatval($cb->spent_amount);

            return response()->json([
                'category_budget' => [
                    'id' => $cb->id,
                    'category_id' => $cb->category_id,
                    'category' => $cb->category?->name,
                    'allocated' => floatval($cb->allocated_amount),
                    'reserved' => floatval($cb->reserved_amount),
                    'spent' => floatval($cb->spent_amount),
                    'available' => $available,
                ],
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Get category budget failure: ' . $e->getMessage());
            return response()->json(['message' => 'An unexpected error occurred.'], 500);
        }
    }
}
