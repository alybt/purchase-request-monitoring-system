<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $name
 * @property string $code
 * @property string|null $description
 * @property float|null $budget_allocation
 * @property float|null $allocation_percentage
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
#[Fillable(['name', 'code', 'description', 'budget_allocation', 'allocation_percentage', 'status', 'head_id'])]
class Department extends Model
{
    use HasFactory;

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function departmentBudgets(): HasMany
    {
        return $this->hasMany(DepartmentBudget::class);
    }

    public function purchaseRequests(): HasMany
    {
        return $this->hasMany(PurchaseRequest::class);
    }

    public function departmentHeads()
    {
        return $this->hasMany(User::class)->where('role', 'department_head');
    }

    public function head()
    {
        return $this->belongsTo(User::class, 'head_id');
    }
}
