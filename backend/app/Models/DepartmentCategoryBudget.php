<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['department_budget_id', 'category_id', 'allocated_amount', 'reserved_amount', 'spent_amount'])]
class DepartmentCategoryBudget extends Model
{
    use HasFactory;

    protected $casts = [
        'allocated_amount' => 'decimal:2',
        'reserved_amount' => 'decimal:2',
        'spent_amount' => 'decimal:2',
        'available_amount' => 'decimal:2',
    ];

    public function departmentBudget()
    {
        return $this->belongsTo(DepartmentBudget::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function getUtilizationPercentageAttribute(): float
    {
        if ($this->allocated_amount == 0) return 0;
        return (($this->reserved_amount + $this->spent_amount) / $this->allocated_amount) * 100;
    }
}
