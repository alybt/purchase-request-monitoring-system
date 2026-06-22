<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Update status enum first (before adding columns that depend on it)
        if (DB::getDriverName() === 'pgsql') {
            // PostgreSQL: Laravel's enum() uses a CHECK constraint, not a named TYPE.
            // Drop the old check constraint and add a new one.
            DB::statement("ALTER TABLE purchase_requests DROP CONSTRAINT IF EXISTS purchase_requests_status_check");

            // Change column type to plain varchar temporarily
            DB::statement("ALTER TABLE purchase_requests ALTER COLUMN status TYPE varchar(255)");

            // Update existing values to 'Draft'
            DB::statement("UPDATE purchase_requests SET status = 'Draft'");

            // Add the new check constraint
            DB::statement("ALTER TABLE purchase_requests ADD CONSTRAINT purchase_requests_status_check CHECK (status IN ('Draft', 'Submitted', 'Approved', 'Rejected', 'Ordered', 'Received', 'Released', 'Completed'))");

            DB::statement("ALTER TABLE purchase_requests ALTER COLUMN status SET DEFAULT 'Draft'");
            DB::statement("ALTER TABLE purchase_requests ALTER COLUMN status SET NOT NULL");
        } else {
            Schema::table('purchase_requests', function (Blueprint $table) {
                $table->enum('status', ['Draft', 'Submitted', 'Approved', 'Rejected', 'Ordered', 'Received', 'Released', 'Completed'])->default('Draft')->change();
            });

            DB::statement("UPDATE purchase_requests SET status = 'Draft'");
        }

        // Add new columns
        Schema::table('purchase_requests', function (Blueprint $table) {
            $table->foreignId('department_id')->nullable()->after('user_id')->constrained('departments')->onDelete('set null');
            $table->foreignId('category_id')->nullable()->after('department_id')->constrained('categories')->onDelete('set null');
            $table->foreignId('approved_by')->nullable()->after('category_id')->constrained('users')->onDelete('set null');
            $table->text('remarks')->nullable()->after('status');
            $table->text('rejection_reason')->nullable()->after('remarks');
            $table->timestampTz('submitted_at')->nullable()->after('updated_at');
            $table->timestampTz('approved_at')->nullable()->after('submitted_at');
            $table->timestampTz('ordered_at')->nullable()->after('approved_at');
            $table->timestampTz('received_at')->nullable()->after('ordered_at');
            $table->timestampTz('released_at')->nullable()->after('received_at');
            $table->timestampTz('completed_at')->nullable()->after('released_at');
        });

        // Rename user_id to requested_by
        Schema::table('purchase_requests', function (Blueprint $table) {
            $table->renameColumn('user_id', 'requested_by');
        });

        // Rename purpose_of_requests to purpose
        Schema::table('purchase_requests', function (Blueprint $table) {
            $table->renameColumn('purpose_of_requests', 'purpose');
        });
    }

    public function down(): void
    {
        // Revert status enum
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("UPDATE purchase_requests SET status = 'Request' WHERE status = 'Submitted'");
            DB::statement("UPDATE purchase_requests SET status = 'Approve' WHERE status = 'Approved'");

            DB::statement("ALTER TABLE purchase_requests DROP CONSTRAINT IF EXISTS purchase_requests_status_check");
            DB::statement("ALTER TABLE purchase_requests ALTER COLUMN status TYPE varchar(255)");
            DB::statement("ALTER TABLE purchase_requests ADD CONSTRAINT purchase_requests_status_check CHECK (status IN ('Request', 'Approve', 'Released', 'Received'))");
            DB::statement("ALTER TABLE purchase_requests ALTER COLUMN status SET DEFAULT 'Request'");
            DB::statement("ALTER TABLE purchase_requests ALTER COLUMN status SET NOT NULL");
        } else {
            DB::statement("UPDATE purchase_requests SET status = 'Request' WHERE status = 'Submitted'");
            DB::statement("UPDATE purchase_requests SET status = 'Approve' WHERE status = 'Approved'");
            Schema::table('purchase_requests', function (Blueprint $table) {
                $table->enum('status', ['Request', 'Approve', 'Released', 'Received'])->default('Request')->change();
            });
        }

        // Drop new columns
        Schema::table('purchase_requests', function (Blueprint $table) {
            $table->dropForeign(['department_id']);
            $table->dropForeign(['category_id']);
            $table->dropForeign(['approved_by']);
            $table->dropColumn(['department_id', 'category_id', 'approved_by', 'remarks', 'rejection_reason', 'submitted_at', 'approved_at', 'ordered_at', 'received_at', 'released_at', 'completed_at']);
        });

        // Rename requested_by back to user_id
        Schema::table('purchase_requests', function (Blueprint $table) {
            $table->renameColumn('requested_by', 'user_id');
        });

        // Rename purpose back to purpose_of_requests
        Schema::table('purchase_requests', function (Blueprint $table) {
            $table->renameColumn('purpose', 'purpose_of_requests');
        });
    }
};
