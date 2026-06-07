<?php

use App\Http\Controllers\AuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/test-connection', function () {
    return response()->json([
        'status' => 'Success',
        'message' => 'Next.js and Laravel are officially talking!'
    ]);
});

Route::post('/login', [AuthController::class,''])->middleware('throttle:login');