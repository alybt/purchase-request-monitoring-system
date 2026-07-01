<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\PurchaseRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    public function metrics(Request $request)
    {
        try {
            $user = $request->user();

            $targetYear = $request->input('fiscalYear', $request->input('fiscal_year'));
            $targetMonth = $request->input('month');

            $parsedYear = null;
            if ($targetYear !== null && $targetYear !== 'All Fiscal Years' && $targetYear !== '') {
                $parsedYear = (int)$targetYear;
            }

            $parsedMonth = null;
            if ($targetMonth !== null && $targetMonth !== 'All Months' && $targetMonth !== '') {
                if (is_numeric($targetMonth)) {
                    $parsedMonth = (int)$targetMonth;
                } else {
                    $monthMap = [
                        'january' => 1, 'february' => 2, 'march' => 3, 'april' => 4, 'may' => 5, 'june' => 6,
                        'july' => 7, 'august' => 8, 'september' => 9, 'october' => 10, 'november' => 11, 'december' => 12
                    ];
                    $lowerMonth = strtolower($targetMonth);
                    if (isset($monthMap[$lowerMonth])) {
                        $parsedMonth = $monthMap[$lowerMonth];
                    }
                }
            }

            $currentYear = $parsedYear ?? now()->year;
            $currentMonth = $parsedMonth ?? now()->month;

            $currentMonthDate = \Carbon\Carbon::create($currentYear, $currentMonth, 1);
            $lastMonthDate = (clone $currentMonthDate)->subMonth();

            // Total Spent (Approved/Ordered/Received/Released/Completed)
            $totalSpentQuery = PurchaseRequest::whereIn('status', ['Approved', 'Ordered', 'Received', 'Released', 'Completed']);
            if ($parsedYear !== null) {
                $totalSpentQuery->whereYear('created_at', $parsedYear);
            }
            if ($parsedMonth !== null) {
                $totalSpentQuery->whereMonth('created_at', $parsedMonth);
            }
            $totalSpent = $totalSpentQuery->sum('total_estimated_cost');

            // Period comparison (Month-over-Month if month is selected, or Year-over-Year if All Months is selected)
            if ($parsedMonth !== null) {
                $currentMonthSpent = PurchaseRequest::whereIn('status', ['Approved', 'Ordered', 'Received', 'Released', 'Completed'])
                    ->whereMonth('created_at', $currentMonth)
                    ->whereYear('created_at', $currentYear)
                    ->sum('total_estimated_cost');

                $lastMonthSpent = PurchaseRequest::whereIn('status', ['Approved', 'Ordered', 'Received', 'Released', 'Completed'])
                    ->whereMonth('created_at', $lastMonthDate->month)
                    ->whereYear('created_at', $lastMonthDate->year)
                    ->sum('total_estimated_cost');
            } else {
                $currentMonthSpent = PurchaseRequest::whereIn('status', ['Approved', 'Ordered', 'Received', 'Released', 'Completed'])
                    ->whereYear('created_at', $currentYear)
                    ->sum('total_estimated_cost');

                $lastMonthSpent = PurchaseRequest::whereIn('status', ['Approved', 'Ordered', 'Received', 'Released', 'Completed'])
                    ->whereYear('created_at', $currentYear - 1)
                    ->sum('total_estimated_cost');
            }

            $changePercentage = 0.0;
            if ($lastMonthSpent > 0) {
                $changePercentage = (($currentMonthSpent - $lastMonthSpent) / $lastMonthSpent) * 100;
            } elseif ($currentMonthSpent > 0) {
                $changePercentage = 100.0;
            }

            // Bottlenecks: Pending > 48 hours
            $bottlenecksQuery = PurchaseRequest::where('status', 'Pending')
                ->where('created_at', '<', now()->subHours(48));
            if ($parsedYear !== null) {
                $bottlenecksQuery->whereYear('created_at', $parsedYear);
            }
            if ($parsedMonth !== null) {
                $bottlenecksQuery->whereMonth('created_at', $parsedMonth);
            }
            $bottlenecksCount = $bottlenecksQuery->count();

            // Active Users
            $activeUsersCount = User::where('status', 'active')->count();

            // Purchase Request Trends by Category
            $categoryTrendsQuery = DB::table('purchase_requests')
                ->join('categories', 'purchase_requests.category_id', '=', 'categories.id')
                ->select(
                    'categories.name as category',
                    DB::raw('count(purchase_requests.id) as count')
                )
                ->where('purchase_requests.status', '!=', 'Draft')
                ->whereNotNull('purchase_requests.category_id');

            if ($parsedYear !== null) {
                $categoryTrendsQuery->whereYear('purchase_requests.created_at', $parsedYear);
            }
            if ($parsedMonth !== null) {
                $categoryTrendsQuery->whereMonth('purchase_requests.created_at', $parsedMonth);
            }

            $categoryTrends = $categoryTrendsQuery->groupBy('categories.id', 'categories.name')
                ->orderBy('count', 'desc')
                ->get()
                ->map(function ($item) {
                    return [
                        'category' => $item->category,
                        'count' => intval($item->count),
                    ];
                });

            // Department breakdown using the new schema
            $departmentBreakdownQuery = DB::table('purchase_requests')
                ->join('departments', 'purchase_requests.department_id', '=', 'departments.id')
                ->select(
                    'departments.name as department',
                    DB::raw('count(purchase_requests.id) as pr_count'),
                    DB::raw('sum(purchase_requests.total_estimated_cost) as total_spent')
                )
                ->whereNotNull('purchase_requests.department_id');

            if ($parsedYear !== null) {
                $departmentBreakdownQuery->whereYear('purchase_requests.created_at', $parsedYear);
            }
            if ($parsedMonth !== null) {
                $departmentBreakdownQuery->whereMonth('purchase_requests.created_at', $parsedMonth);
            }

            $departmentBreakdown = $departmentBreakdownQuery->groupBy('departments.id', 'departments.name')
                ->get()
                ->map(function ($item) {
                    return [
                        'department' => $item->department,
                        'pr_count' => intval($item->pr_count),
                        'total_spent' => floatval($item->total_spent ?? 0),
                    ];
                });

            return response()->json([
                'metrics' => [
                    'total_spent' => floatval($totalSpent),
                    'total_spent_change_percentage' => round($changePercentage, 1),
                    'bottlenecks' => $bottlenecksCount,
                    'active_users' => $activeUsersCount,
                    'category_trends' => $categoryTrends,
                    'department_breakdown' => $departmentBreakdown,
                ]
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Get dashboard metrics failure: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['message' => 'An unexpected error occurred. Please try again later.'], 500);
        }
    }

    public function recentPrs(Request $request)
    {
        try {
            $query = PurchaseRequest::with(['requester', 'department', 'category']);

            $fiscalYear = $request->input('fiscalYear', $request->input('fiscal_year'));
            $month = $request->input('month');

            if ($fiscalYear !== null && $fiscalYear !== 'All Fiscal Years' && $fiscalYear !== '') {
                $query->whereYear('created_at', $fiscalYear);
            }
            if ($month !== null && $month !== 'All Months' && $month !== '') {
                if (is_numeric($month)) {
                    $query->whereMonth('created_at', (int)$month);
                } else {
                    $monthMap = [
                        'january' => 1, 'february' => 2, 'march' => 3, 'april' => 4, 'may' => 5, 'june' => 6,
                        'july' => 7, 'august' => 8, 'september' => 9, 'october' => 10, 'november' => 11, 'december' => 12
                    ];
                    $lowerMonth = strtolower($month);
                    if (isset($monthMap[$lowerMonth])) {
                        $query->whereMonth('created_at', $monthMap[$lowerMonth]);
                    }
                }
            }

            $recentPrs = $query->orderBy('created_at', 'desc')
                ->limit(5)
                ->get();

            return response()->json([
                'recent_purchase_requests' => $recentPrs
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Get recent PRs failure: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['message' => 'An unexpected error occurred. Please try again later.'], 500);
        }
    }

    public function pendingApprovals(Request $request)
    {
        try {
            $query = PurchaseRequest::with(['requester', 'department', 'category'])
                ->where('status', 'Pending');

            $fiscalYear = $request->input('fiscalYear', $request->input('fiscal_year'));
            $month = $request->input('month');

            if ($fiscalYear !== null && $fiscalYear !== 'All Fiscal Years' && $fiscalYear !== '') {
                $query->whereYear('created_at', $fiscalYear);
            }
            if ($month !== null && $month !== 'All Months' && $month !== '') {
                if (is_numeric($month)) {
                    $query->whereMonth('created_at', (int)$month);
                } else {
                    $monthMap = [
                        'january' => 1, 'february' => 2, 'march' => 3, 'april' => 4, 'may' => 5, 'june' => 6,
                        'july' => 7, 'august' => 8, 'september' => 9, 'october' => 10, 'november' => 11, 'december' => 12
                    ];
                    $lowerMonth = strtolower($month);
                    if (isset($monthMap[$lowerMonth])) {
                        $query->whereMonth('created_at', $monthMap[$lowerMonth]);
                    }
                }
            }

            $pendingApprovals = $query->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'pending_approvals' => $pendingApprovals
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Get pending approvals failure: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['message' => 'An unexpected error occurred. Please try again later.'], 500);
        }
    }
}
