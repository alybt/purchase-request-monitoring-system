<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['pr_id', 'approver_id', 'status', 'comments', 'action_date'])]
class ApprovalForm extends Model
{
    use HasFactory;

    protected $table = 'approval_form';

    protected function casts(): array
    {
        return [
            'action_date' => 'datetime',
        ];
    }

    public function purchaseRequest()
    {
        return $this->belongsTo(PurchaseRequest::class, 'pr_id');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approver_id');
    }
}
