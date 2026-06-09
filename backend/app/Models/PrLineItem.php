<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable(['pr_id', 'item_name', 'description', 'quantity', 'unit_price', 'total_price', 'vendor'])]
class PrLineItem extends Model
{
    use HasFactory;

    protected $table = 'pr_line_items';

    public function purchaseRequest()
    {
        return $this->belongsTo(PurchaseRequest::class, 'pr_id');
    }
}
