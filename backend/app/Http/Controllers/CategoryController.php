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

    public function store(Request $request)
    {
        try {
            $request->validate([
                'name'        => 'required|string|max:255',
                'code'        => 'required|string|max:20|unique:categories,code',
                'description' => 'nullable|string',
            ]);

            $category = Category::create([
                'name'        => $request->input('name'),
                'code'        => strtoupper($request->input('code')),
                'description' => $request->input('description'),
            ]);

            return response()->json([
                'message'  => 'Category created successfully.',
                'category' => $category,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('Create category failure: ' . $e->getMessage());
            return response()->json(['message' => 'An unexpected error occurred.'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $category = Category::find($id);
            if (!$category) {
                return response()->json(['message' => 'Category not found.'], 404);
            }

            $request->validate([
                'name'        => 'sometimes|required|string|max:255',
                'code'        => 'sometimes|required|string|max:20|unique:categories,code,' . $id,
                'description' => 'nullable|string',
            ]);

            if ($request->has('code')) {
                $request->merge(['code' => strtoupper($request->input('code'))]);
            }

            $category->update($request->only(['name', 'code', 'description']));

            return response()->json([
                'message'  => 'Category updated successfully.',
                'category' => $category,
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('Update category failure: ' . $e->getMessage());
            return response()->json(['message' => 'An unexpected error occurred.'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $category = Category::find($id);
            if (!$category) {
                return response()->json(['message' => 'Category not found.'], 404);
            }

            if ($category->purchaseRequests()->exists()) {
                return response()->json(['message' => 'Cannot delete category associated with purchase requests.'], 400);
            }

            $category->delete();

            return response()->json(['message' => 'Category deleted successfully.'], 200);
        } catch (\Throwable $e) {
            Log::error('Delete category failure: ' . $e->getMessage());
            return response()->json(['message' => 'An unexpected error occurred.'], 500);
        }
    }

    public function bulkDestroy(Request $request)
    {
        try {
            $request->validate([
                'ids'   => 'required|array',
                'ids.*' => 'integer|exists:categories,id',
            ]);

            $ids = $request->input('ids');
            
            $categories = Category::whereIn('id', $ids)->get();
            $undeletable = [];
            $deletable = [];

            foreach ($categories as $category) {
                if ($category->purchaseRequests()->exists()) {
                    $undeletable[] = $category->name;
                } else {
                    $deletable[] = $category->id;
                }
            }

            if (!empty($deletable)) {
                Category::whereIn('id', $deletable)->delete();
            }

            if (!empty($undeletable)) {
                return response()->json([
                    'message' => 'Some categories could not be deleted because they are associated with purchase requests: ' . implode(', ', $undeletable),
                ], 400);
            }

            return response()->json(['message' => 'Categories deleted successfully.'], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('Bulk delete categories failure: ' . $e->getMessage());
            return response()->json(['message' => 'An unexpected error occurred.'], 500);
        }
    }
}
