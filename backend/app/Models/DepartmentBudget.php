<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['department_id', 'fiscal_year', 'month', 'allocated_amount', 'reserved_amount', 'spent_amount'])]
class DepartmentBudget extends Model
{
    use HasFactory;

    protected $casts = [
        'allocated_amount' => 'decimal:2',
        'reserved_amount' => 'decimal:2',
        'spent_amount' => 'decimal:2',
        'available_amount' => 'decimal:2',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function departmentCategoryBudgets()
    {
        return $this->hasMany(DepartmentCategoryBudget::class);
    }

    public function getUtilizationPercentageAttribute(): float
    {
        if ($this->allocated_amount == 0) return 0;
        return (($this->reserved_amount + $this->spent_amount) / $this->allocated_amount) * 100;
    }
}
