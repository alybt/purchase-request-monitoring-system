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
        Schema::table('company_budgets', function (Blueprint $table) {
            $table->decimal('carry_forward', 15, 2)->default(0)->after('total_budget');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('company_budgets', function (Blueprint $table) {
            $table->dropColumn('carry_forward');
        });
    }
};
