<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('company_budgets', 'approved_budget') && !Schema::hasColumn('company_budgets', 'total_budget')) {
            if (DB::getDriverName() === 'pgsql') {
                DB::statement('ALTER TABLE company_budgets DROP COLUMN IF EXISTS available_amount');
                DB::statement('ALTER TABLE company_budgets RENAME COLUMN approved_budget TO total_budget');
                DB::statement('ALTER TABLE company_budgets ADD COLUMN available_amount DECIMAL(15,2) GENERATED ALWAYS AS (total_budget - allocated_amount) STORED');
            } else {
                Schema::table('company_budgets', function (Blueprint $table) {
                    $table->dropColumn('available_amount');
                    $table->renameColumn('approved_budget', 'total_budget');
                });
                Schema::table('company_budgets', function (Blueprint $table) {
                    $table->decimal('available_amount', 15, 2)
                        ->storedAs('total_budget - allocated_amount')
                        ->nullable();
                });
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('company_budgets', 'total_budget') && !Schema::hasColumn('company_budgets', 'approved_budget')) {
            if (DB::getDriverName() === 'pgsql') {
                DB::statement('ALTER TABLE company_budgets DROP COLUMN IF EXISTS available_amount');
                DB::statement('ALTER TABLE company_budgets RENAME COLUMN total_budget TO approved_budget');
                DB::statement('ALTER TABLE company_budgets ADD COLUMN available_amount DECIMAL(15,2) GENERATED ALWAYS AS (approved_budget - allocated_amount) STORED');
            }
        }
    }
};
