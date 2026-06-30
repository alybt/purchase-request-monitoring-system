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
        if (!Schema::hasColumn('company_budgets', 'month')) {
            Schema::table('company_budgets', function (Blueprint $table) {
                $table->integer('month')->nullable()->after('fiscal_year');
                $table->dropUnique(['fiscal_year']);
                $table->unique(['fiscal_year', 'month']);
            });
        }

        if (!Schema::hasColumn('department_budgets', 'month')) {
            Schema::table('department_budgets', function (Blueprint $table) {
                $table->integer('month')->nullable()->after('fiscal_year');
                $table->dropUnique(['department_id', 'fiscal_year']);
                $table->unique(['department_id', 'fiscal_year', 'month']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('department_budgets', function (Blueprint $table) {
            $table->dropUnique(['department_id', 'fiscal_year', 'month']);
            $table->dropColumn('month');
            $table->unique(['department_id', 'fiscal_year']);
        });

        Schema::table('company_budgets', function (Blueprint $table) {
            $table->dropUnique(['fiscal_year', 'month']);
            $table->dropColumn('month');
            $table->unique(['fiscal_year']);
        });
    }
};
