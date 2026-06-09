<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pr_status') THEN
                    CREATE TYPE pr_status AS ENUM ('Request', 'Approve', 'Released', 'Received');
                END IF;
            END $$;");
        }

        Schema::create('purchase_requests', function (Blueprint $table) {
            $table->id();
            $table->string('pr_number', 50)->unique();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->text('purpose_of_requests');
            $table->decimal('total_estimated_cost', 12, 2)->default(0.00);
            $table->timestampsTz();
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE purchase_requests ADD COLUMN status pr_status NOT NULL DEFAULT 'Request'");
        } else {
            Schema::table('purchase_requests', function (Blueprint $table) {
                $table->enum('status', ['Request', 'Approve', 'Released', 'Received'])->default('Request');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_requests');

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP TYPE IF EXISTS pr_status;');
        }
    }
};
