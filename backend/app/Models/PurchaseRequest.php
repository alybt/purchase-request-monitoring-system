<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'pr_number',
    'department_id',
    'category_id',
    'requested_by',
    'approved_by',
    'purpose',
    'purpose_of_requests',
    'user_id',
    'total_estimated_cost',
    'status',
    'remarks',
    'rejection_reason',
    'submitted_at',
    'approved_at',
    'ordered_at',
    'received_at',
    'released_at',
    'completed_at'
])]
class PurchaseRequest extends Model
{
    use HasFactory;

    protected $casts = [
        'total_estimated_cost' => 'decimal:2',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
        'ordered_at' => 'datetime',
        'received_at' => 'datetime',
        'released_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function items()
    {
        return $this->hasMany(PurchaseRequestItem::class);
    }

    public function lineItems()
    {
        return $this->items();
    }

    public function user()
    {
        return $this->requester();
    }

    public function setUserIdAttribute($value)
    {
        $this->attributes['requested_by'] = $value;
    }

    public function getUserIdAttribute()
    {
        return $this->requested_by;
    }

    public function setPurposeOfRequestsAttribute($value)
    {
        $this->attributes['purpose'] = $value;
    }

    public function getPurposeOfRequestsAttribute()
    {
        return $this->purpose;
    }

    public function attachments()
    {
        return $this->hasMany(PurchaseRequestAttachment::class);
    }

    public function statusHistory()
    {
        return $this->hasMany(PurchaseRequestStatusHistory::class)->orderBy('created_at');
    }

    public function canBeSubmitted(): bool
    {
        return in_array($this->status, ['Draft', 'Request']);
    }

    public function canBeApproved(): bool
    {
        return in_array($this->status, ['Submitted', 'Request', 'Draft']);
    }

    public function canBeRejected(): bool
    {
        return in_array($this->status, ['Submitted', 'Request', 'Draft']);
    }

    public function canBeOrdered(): bool
    {
        return $this->status === 'Approved';
    }

    public function canBeReceived(): bool
    {
        return $this->status === 'Ordered';
    }

    public function canBeReleased(): bool
    {
        return $this->status === 'Received';
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByDepartment($query, $departmentId)
    {
        return $query->where('department_id', $departmentId);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'Submitted');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'Approved');
    }
}
