<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Drop the old constraint
        DB::statement("ALTER TABLE purchase_requests DROP CONSTRAINT IF EXISTS purchase_requests_status_check");

        // 2. Update the rows so they comply with the new constraint
        DB::statement("UPDATE purchase_requests SET status = 'Pending' WHERE status = 'Submitted'");

        // 3. Update histories
        DB::statement("UPDATE purchase_request_status_history SET from_status = 'Pending' WHERE from_status = 'Submitted'");
        DB::statement("UPDATE purchase_request_status_history SET to_status = 'Pending' WHERE to_status = 'Submitted'");
        DB::statement("UPDATE purchase_request_status_history SET remarks = REPLACE(remarks, 'Submitted', 'Pending')");
        
        // 4. Add the new constraint
        DB::statement("ALTER TABLE purchase_requests ADD CONSTRAINT purchase_requests_status_check CHECK (status IN ('Draft', 'Pending', 'Approved', 'Rejected', 'Ordered', 'Received', 'Released', 'Completed'))");
    }

    public function down(): void
    {
        try {
            DB::statement("ALTER TABLE purchase_requests DROP CONSTRAINT IF EXISTS purchase_requests_status_check");
            DB::statement("ALTER TABLE purchase_requests ADD CONSTRAINT purchase_requests_status_check CHECK (status IN ('Draft', 'Submitted', 'Approved', 'Rejected', 'Ordered', 'Received', 'Released', 'Completed'))");
        } catch (\Exception $e) {}

        DB::statement("UPDATE purchase_requests SET status = 'Submitted' WHERE status = 'Pending'");

        DB::statement("UPDATE purchase_request_status_history SET from_status = 'Submitted' WHERE from_status = 'Pending'");
        DB::statement("UPDATE purchase_request_status_history SET to_status = 'Submitted' WHERE to_status = 'Pending'");
        DB::statement("UPDATE purchase_request_status_history SET remarks = REPLACE(remarks, 'Pending', 'Submitted')");
    }
};
