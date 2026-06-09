<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['pr_number', 'user_id', 'purpose_of_requests', 'total_estimated_cost', 'status'])]
class PurchaseRequest extends Model
{
    use HasFactory;

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function lineItems()
    {
        return $this->hasMany(PrLineItem::class, 'pr_id');
    }

    public function approvals()
    {
        return $this->hasMany(ApprovalForm::class, 'pr_id');
    }
}
