<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('company_budgets', function (Blueprint $table) {
            $table->id();
            $table->integer('fiscal_year')->unique();
            $table->decimal('total_budget', 15, 2)->default(0.00);
            $table->decimal('allocated_amount', 15, 2)->default(0.00);
            $table->timestampsTz();
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('
                ALTER TABLE company_budgets 
                ADD COLUMN available_amount DECIMAL(15,2) 
                GENERATED ALWAYS AS (total_budget - allocated_amount) STORED
            ');
        } else {
            Schema::table('company_budgets', function (Blueprint $table) {
                $table->decimal('available_amount', 15, 2)
                    ->storedAs('total_budget - allocated_amount')
                    ->nullable();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('company_budgets');
    }
};
