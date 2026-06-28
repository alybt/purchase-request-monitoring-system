<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('department_budgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->constrained('departments')->onDelete('cascade');
            $table->integer('fiscal_year')->nullable();
            $table->integer('month')->default(1);
            $table->decimal('allocated_amount', 15, 2)->default(0.00);
            $table->decimal('reserved_amount', 15, 2)->default(0.00);
            $table->decimal('spent_amount', 15, 2)->default(0.00);
            $table->timestampsTz();
            
            $table->unique(['department_id', 'fiscal_year', 'month']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('
                ALTER TABLE department_budgets 
                ADD COLUMN available_amount DECIMAL(15,2) 
                GENERATED ALWAYS AS (allocated_amount - reserved_amount - spent_amount) STORED
            ');
        } else {
            Schema::table('department_budgets', function (Blueprint $table) {
                $table->decimal('available_amount', 15, 2)
                    ->storedAs('allocated_amount - reserved_amount - spent_amount')
                    ->nullable();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('department_budgets');
    }
};
