<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Update role enum to remove 'approver' and 'employee', add 'department_head'
        if (DB::getDriverName() === 'pgsql') {
            // PostgreSQL: Laravel's enum() uses a CHECK constraint, not a named TYPE.
            // We need to drop the old check constraint and add a new one.

            // First, update existing values so they fit the new allowed set
            DB::statement("UPDATE users SET role = 'admin' WHERE role IN ('employee', 'approver')");

            // Drop the old check constraint (Laravel names it {table}_{column}_check)
            DB::statement("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");

            // Change column type to plain varchar (temporarily allows any value)
            DB::statement("ALTER TABLE users ALTER COLUMN role TYPE varchar(255)");

            // Update non-admin users to department_head
            DB::statement("UPDATE users SET role = 'department_head' WHERE role != 'admin'");

            // Add the new check constraint
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'department_head'))");

            // Set the new default
            DB::statement("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'department_head'");
            DB::statement("ALTER TABLE users ALTER COLUMN role SET NOT NULL");
        } else {
            // MySQL/MariaDB: Modify the enum directly
            Schema::table('users', function (Blueprint $table) {
                $table->enum('role', ['admin', 'department_head'])->default('department_head')->change();
            });
            
            // Update existing values
            DB::statement("UPDATE users SET role = 'department_head' WHERE role = 'employee'");
            DB::statement("UPDATE users SET role = 'admin' WHERE role = 'approver'");
        }

        // Drop the old department string column
        if (Schema::hasColumn('users', 'department')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('department');
            });
        }

        // Add department_id foreign key
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('department_id')->nullable()->after('status')->constrained('departments')->onDelete('set null');
        });
    }

    public function down(): void
    {
        // Drop department_id first
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['department_id']);
            $table->dropColumn('department_id');
        });

        // Add back department string
        Schema::table('users', function (Blueprint $table) {
            $table->string('department', 100)->nullable()->after('status');
        });

        // Revert role enum
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE users ALTER COLUMN role DROP DEFAULT");
            DB::statement("ALTER TABLE users ALTER COLUMN role DROP NOT NULL");
            
            // Update to admin (exists in both)
            DB::statement("UPDATE users SET role = 'admin'");
            
            DB::statement("ALTER TYPE user_role RENAME TO user_role_new");
            DB::statement("CREATE TYPE user_role AS ENUM ('admin', 'approver', 'employee')");
            DB::statement("ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::text::user_role");
            
            // Update non-admin to employee
            DB::statement("UPDATE users SET role = 'employee' WHERE email NOT LIKE '%admin%'");
            
            DB::statement("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'employee'");
            DB::statement("ALTER TABLE users ALTER COLUMN role SET NOT NULL");
            DB::statement("DROP TYPE user_role_new");
        } else {
            DB::statement("UPDATE users SET role = 'employee' WHERE role = 'department_head'");
            Schema::table('users', function (Blueprint $table) {
                $table->enum('role', ['admin', 'approver', 'employee'])->default('employee')->change();
            });
        }
    }
};
