<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->string('code', 20)->unique();
            $table->text('description')->nullable();
            $table->decimal('budget_allocation', 15, 2)->default(0.00);
            $table->decimal('allocation_percentage', 5, 2)->default(0.00);
            $table->timestampsTz();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('departments');
    }
};
