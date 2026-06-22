<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CategoryController extends Controller
{
    public function index()
    {
        try {
            $categories = Category::orderBy('name')->get(['id', 'name', 'code', 'description']);
            return response()->json(['categories' => $categories], 200);
        } catch (\Throwable $e) {
            Log::error('List categories failure: ' . $e->getMessage());
            return response()->json(['message' => 'An unexpected error occurred.'], 500);
        }
    }
}
