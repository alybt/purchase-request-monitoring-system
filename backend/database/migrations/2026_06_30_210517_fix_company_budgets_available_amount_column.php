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
        if (\Illuminate\Support\Facades\DB::getDriverName() === 'pgsql') {
            \Illuminate\Support\Facades\DB::statement('ALTER TABLE company_budgets DROP COLUMN IF EXISTS available_amount');
            \Illuminate\Support\Facades\DB::statement('ALTER TABLE company_budgets ADD COLUMN available_amount DECIMAL(15,2) GENERATED ALWAYS AS (total_budget + carry_forward - allocated_amount) STORED');
        } else {
            Schema::table('company_budgets', function (Blueprint $table) {
                if (Schema::hasColumn('company_budgets', 'available_amount')) {
                    $table->dropColumn('available_amount');
                }
            });
            Schema::table('company_budgets', function (Blueprint $table) {
                $table->decimal('available_amount', 15, 2)
                    ->storedAs('total_budget + carry_forward - allocated_amount')
                    ->nullable();
            });
        }
    }

    public function down(): void
    {
        if (\Illuminate\Support\Facades\DB::getDriverName() === 'pgsql') {
            \Illuminate\Support\Facades\DB::statement('ALTER TABLE company_budgets DROP COLUMN IF EXISTS available_amount');
            \Illuminate\Support\Facades\DB::statement('ALTER TABLE company_budgets ADD COLUMN available_amount DECIMAL(15,2) GENERATED ALWAYS AS (total_budget - allocated_amount) STORED');
        } else {
            Schema::table('company_budgets', function (Blueprint $table) {
                if (Schema::hasColumn('company_budgets', 'available_amount')) {
                    $table->dropColumn('available_amount');
                }
            });
            Schema::table('company_budgets', function (Blueprint $table) {
                $table->decimal('available_amount', 15, 2)
                    ->storedAs('total_budget - allocated_amount')
                    ->nullable();
            });
        }
    }
};
