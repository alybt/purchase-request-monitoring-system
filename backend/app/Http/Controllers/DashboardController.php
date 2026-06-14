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
            // 1. Total Spent (where status in ['Approve', 'Released', 'Received'])
            $totalSpent = PurchaseRequest::whereIn('status', ['Approve', 'Released', 'Received'])
                ->sum('total_estimated_cost');

            // 2. Percentage change from last month
            $currentMonth = now()->month;
            $currentYear = now()->year;
            $lastMonthDate = now()->subMonth();
            $lastMonth = $lastMonthDate->month;
            $lastMonthYear = $lastMonthDate->year;

            $currentMonthSpent = PurchaseRequest::whereIn('status', ['Approve', 'Released', 'Received'])
                ->whereMonth('created_at', $currentMonth)
                ->whereYear('created_at', $currentYear)
                ->sum('total_estimated_cost');

            $lastMonthSpent = PurchaseRequest::whereIn('status', ['Approve', 'Released', 'Received'])
                ->whereMonth('created_at', $lastMonth)
                ->whereYear('created_at', $lastMonthYear)
                ->sum('total_estimated_cost');

            $changePercentage = 0.0;
            if ($lastMonthSpent > 0) {
                $changePercentage = (($currentMonthSpent - $lastMonthSpent) / $lastMonthSpent) * 100;
            } elseif ($currentMonthSpent > 0) {
                $changePercentage = 100.0;
            }

            // 3. Bottlenecks (status = 'Request' and pending > 48 hours)
            $bottlenecksCount = PurchaseRequest::where('status', 'Request')
                ->where('created_at', '<', now()->subHours(48))
                ->count();

            // 4. Active Users count
            $activeUsersCount = User::where('status', 'active')->count();

            // 5. Monthly expenditure for the last 6 months
            $monthlyData = [];
            for ($i = 5; $i >= 0; $i--) {
                $date = now()->subMonths($i);
                $monthName = $date->format('F');
                $m = $date->month;
                $y = $date->year;

                $spent = PurchaseRequest::whereIn('status', ['Approve', 'Released', 'Received'])
                    ->whereMonth('created_at', $m)
                    ->whereYear('created_at', $y)
                    ->sum('total_estimated_cost');

                $monthlyData[] = [
                    'month' => $monthName,
                    'spent' => floatval($spent),
                ];
            }

            // 6. Department breakdown
            $departmentBreakdown = DB::table('purchase_requests')
                ->join('users', 'purchase_requests.user_id', '=', 'users.id')
                ->select(
                    'users.department',
                    DB::raw('count(purchase_requests.id) as pr_count'),
                    DB::raw('sum(purchase_requests.total_estimated_cost) as total_spent')
                )
                ->groupBy('users.department')
                ->get()
                ->map(function ($item) {
                    return [
                        'department' => $item->department,
                        'pr_count' => intval($item->pr_count),
                        'total_spent' => floatval($item->total_spent ?? 0.00),
                    ];
                });

            return response()->json([
                'metrics' => [
                    'total_spent' => floatval($totalSpent),
                    'total_spent_change_percentage' => round($changePercentage, 1),
                    'bottlenecks' => $bottlenecksCount,
                    'active_users' => $activeUsersCount,
                    'monthly_data' => $monthlyData,
                    'department_breakdown' => $departmentBreakdown,
                ]
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Get dashboard metrics failure: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An unexpected error occurred. Please try again later.'
            ], 500);
        }
    }

    public function recentPrs()
    {
        try {
            $recentPrs = PurchaseRequest::with('user')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get();

            return response()->json([
                'recent_purchase_requests' => $recentPrs
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Get recent PRs failure: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An unexpected error occurred. Please try again later.'
            ], 500);
        }
    }

    public function pendingApprovals()
    {
        try {
            $pendingApprovals = PurchaseRequest::with('user')
                ->where('status', 'Request')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'pending_approvals' => $pendingApprovals
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Get pending approvals failure: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An unexpected error occurred. Please try again later.'
            ], 500);
        }
    }
}
