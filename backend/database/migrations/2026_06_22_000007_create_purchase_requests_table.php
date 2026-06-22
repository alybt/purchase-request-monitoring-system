<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('purchase_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('pr_number')->unique();
            $table->text('purpose_of_requests');
            $table->decimal('total_estimated_cost', 15, 2)->default(0);
            
            if (DB::getDriverName() === 'pgsql') {
                $table->enum('status', ['Request', 'Approve', 'Released', 'Received'])->default('Request');
            } else {
                $table->enum('status', ['Request', 'Approve', 'Released', 'Received'])->default('Request');
            }
            
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_requests');
    }
};
