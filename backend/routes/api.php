<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\PurchaseRequestController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ApprovalController;
use App\Http\Controllers\BudgetController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DepartmentController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/test-connection', function () {
    return response()->json([
        'status' => 'Success',
        'message' => 'Next.js and Laravel are officially talking!'
    ]);
});

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Users (Read accessible to authenticated users, mutations restricted to admin)
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{id}', [UserController::class, 'show']);

    // Categories
    Route::get('/categories', [CategoryController::class, 'index']);

    // Departments (Read accessible, mutations restricted to admin)
    Route::get('/departments', [DepartmentController::class, 'index']);
    Route::get('/departments/budget-summary', [DepartmentController::class, 'budgetSummary']);
    Route::get('/departments/{id}/budget-calculations', [DepartmentController::class, 'budgetCalculations']);

    // Purchase Requests
    Route::get('/purchase-requests', [PurchaseRequestController::class, 'index']);
    Route::post('/purchase-requests', [PurchaseRequestController::class, 'store']);
    Route::get('/purchase-requests/{id}', [PurchaseRequestController::class, 'show']);
    Route::put('/purchase-requests/{id}', [PurchaseRequestController::class, 'update']);
    Route::delete('/purchase-requests/{id}', [PurchaseRequestController::class, 'destroy']);

    // Budget
    Route::get('/budget/my-department', [BudgetController::class, 'myDepartmentBudget']);
    Route::get('/budget/category/{categoryId}', [BudgetController::class, 'categoryBudget']);

    // Dashboard
    Route::get('/dashboard/metrics', [DashboardController::class, 'metrics']);
    Route::get('/dashboard/recent-prs', [DashboardController::class, 'recentPrs']);
    Route::get('/dashboard/pending-approvals', [DashboardController::class, 'pendingApprovals']);

    // Admin-only management routes
    Route::middleware('role:admin')->group(function () {
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
        Route::post('/users/bulk-delete', [UserController::class, 'bulkDestroy']);

        Route::post('/departments', [DepartmentController::class, 'store']);
        Route::put('/departments/{id}', [DepartmentController::class, 'update']);
        Route::put('/departments/{id}/budget', [DepartmentController::class, 'updateBudget']);

        Route::post('/purchase-requests/bulk-delete', [PurchaseRequestController::class, 'bulkDestroy']);
    });

    // Approval routes (Approvers & Admins only)
    Route::middleware('role:admin,department_head')->group(function () {
        Route::post('/purchase-requests/{id}/approve', [ApprovalController::class, 'approve']);
        Route::post('/purchase-requests/{id}/reject', [ApprovalController::class, 'reject']);
    });
});