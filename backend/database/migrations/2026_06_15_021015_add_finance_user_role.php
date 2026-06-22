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
        DB::commit();

        DB::statement("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'finance'");
        
        // Restart the transaction so Laravel can finish the migration process cleanly.
        DB::beginTransaction();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
