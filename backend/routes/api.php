<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\PurchaseRequestController;
use App\Http\Controllers\DashboardController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/test-connection', function () {
    return response()->json([
        'status' => 'Success',
        'message' => 'Next.js and Laravel are officially talking!'
    ]);
});

Route::post('/login', [AuthController::class,'login'])->middleware('throttle:login');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
    Route::post('/users/bulk-delete', [UserController::class, 'bulkDestroy']);

    Route::get('/purchase-requests', [PurchaseRequestController::class, 'index']);
    Route::post('/purchase-requests', [PurchaseRequestController::class, 'store']);
    Route::get('/purchase-requests/{id}', [PurchaseRequestController::class, 'show']);
    Route::put('/purchase-requests/{id}', [PurchaseRequestController::class, 'update']);
    Route::delete('/purchase-requests/{id}', [PurchaseRequestController::class, 'destroy']);
    Route::post('/purchase-requests/bulk-delete', [PurchaseRequestController::class, 'bulkDestroy']);
    Route::post('/purchase-requests/{id}/approve', [PurchaseRequestController::class, 'approve']);
    Route::post('/purchase-requests/{id}/reject', [PurchaseRequestController::class, 'reject']);

    Route::get('/dashboard/metrics', [DashboardController::class, 'metrics']);
    Route::get('/dashboard/recent-prs', [DashboardController::class, 'recentPrs']);
    Route::get('/dashboard/pending-approvals', [DashboardController::class, 'pendingApprovals']);
});