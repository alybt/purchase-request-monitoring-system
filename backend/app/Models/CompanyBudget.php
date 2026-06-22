<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['fiscal_year', 'total_budget', 'allocated_amount'])]
class CompanyBudget extends Model
{
    use HasFactory;

    protected $casts = [
        'total_budget' => 'decimal:2',
        'allocated_amount' => 'decimal:2',
        'available_amount' => 'decimal:2',
    ];

    public function departmentBudgets()
    {
        return $this->hasMany(DepartmentBudget::class, 'fiscal_year', 'fiscal_year');
    }

    public function getUtilizationPercentageAttribute(): float
    {
        if ($this->total_budget == 0) return 0;
        return ($this->allocated_amount / $this->total_budget) * 100;
    }
}
