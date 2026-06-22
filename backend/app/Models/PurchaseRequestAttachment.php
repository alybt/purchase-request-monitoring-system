<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['purchase_request_id', 'file_name', 'file_path', 'file_size', 'file_type', 'uploaded_by'])]
class PurchaseRequestAttachment extends Model
{
    use HasFactory;

    protected $casts = [
        'file_size' => 'integer',
    ];

    public function purchaseRequest()
    {
        return $this->belongsTo(PurchaseRequest::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
