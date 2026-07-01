<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('purchase_requests', function (Blueprint $table) {
            $table->string('supplier_name')->nullable();
            $table->string('purchase_order_number')->nullable();
            $table->date('expected_delivery_date')->nullable();
            $table->text('procurement_remarks')->nullable();
            $table->foreignId('ordered_by')->nullable()->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchase_requests', function (Blueprint $table) {
            $table->dropForeign(['ordered_by']);
            $table->dropColumn([
                'supplier_name',
                'purchase_order_number',
                'expected_delivery_date',
                'procurement_remarks',
                'ordered_by'
            ]);
        });
    }
};
