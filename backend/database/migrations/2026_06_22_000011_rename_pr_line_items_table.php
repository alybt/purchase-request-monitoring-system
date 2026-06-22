<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::rename('pr_line_items', 'purchase_request_items');
    }

    public function down(): void
    {
        Schema::rename('purchase_request_items', 'pr_line_items');
    }
};
