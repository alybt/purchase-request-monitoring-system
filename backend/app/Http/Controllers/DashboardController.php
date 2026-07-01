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

            // Total Spent (Approved/Ordered/Received/Released/Completed)
            $totalSpent = PurchaseRequest::whereIn('status', ['Approved', 'Ordered', 'Received', 'Released', 'Completed'])
                ->sum('total_estimated_cost');

            // Monthly comparison
            $currentMonth = now()->month;
            $currentYear = now()->year;
            $lastMonthDate = now()->subMonth();

            $currentMonthSpent = PurchaseRequest::whereIn('status', ['Approved', 'Ordered', 'Received', 'Released', 'Completed'])
                ->whereMonth('created_at', $currentMonth)
                ->whereYear('created_at', $currentYear)
                ->sum('total_estimated_cost');

            $lastMonthSpent = PurchaseRequest::whereIn('status', ['Approved', 'Ordered', 'Received', 'Released', 'Completed'])
                ->whereMonth('created_at', $lastMonthDate->month)
                ->whereYear('created_at', $lastMonthDate->year)
                ->sum('total_estimated_cost');

            $changePercentage = 0.0;
            if ($lastMonthSpent > 0) {
                $changePercentage = (($currentMonthSpent - $lastMonthSpent) / $lastMonthSpent) * 100;
            } elseif ($currentMonthSpent > 0) {
                $changePercentage = 100.0;
            }

            // Bottlenecks: Pending > 48 hours
            $bottlenecksCount = PurchaseRequest::where('status', 'Pending')
                ->where('created_at', '<', now()->subHours(48))
                ->count();

            // Active Users
            $activeUsersCount = User::where('status', 'active')->count();

            // Purchase Request Trends by Category
            $categoryTrends = DB::table('purchase_requests')
                ->join('categories', 'purchase_requests.category_id', '=', 'categories.id')
                ->select(
                    'categories.name as category',
                    DB::raw('count(purchase_requests.id) as count')
                )
                ->where('purchase_requests.status', '!=', 'Draft')
                ->whereNotNull('purchase_requests.category_id')
                ->groupBy('categories.id', 'categories.name')
                ->orderBy('count', 'desc')
                ->get()
                ->map(function ($item) {
                    return [
                        'category' => $item->category,
                        'count' => intval($item->count),
                    ];
                });

            // Department breakdown using the new schema
            $departmentBreakdown = DB::table('purchase_requests')
                ->join('departments', 'purchase_requests.department_id', '=', 'departments.id')
                ->select(
                    'departments.name as department',
                    DB::raw('count(purchase_requests.id) as pr_count'),
                    DB::raw('sum(purchase_requests.total_estimated_cost) as total_spent')
                )
                ->whereNotNull('purchase_requests.department_id')
                ->groupBy('departments.id', 'departments.name')
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

    public function recentPrs()
    {
        try {
            $recentPrs = PurchaseRequest::with(['requester', 'department', 'category'])
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
            return response()->json(['message' => 'An unexpected error occurred. Please try again later.'], 500);
        }
    }

    public function pendingApprovals()
    {
        try {
            $pendingApprovals = PurchaseRequest::with(['requester', 'department', 'category'])
                ->where('status', 'Pending')
                ->orderBy('created_at', 'desc')
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
