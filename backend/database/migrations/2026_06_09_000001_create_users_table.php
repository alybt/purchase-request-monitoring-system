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
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
                    CREATE TYPE user_role AS ENUM ('admin', 'approver', 'employee');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
                    CREATE TYPE user_status AS ENUM ('active', 'dismissed', 'suspended');
                END IF;
            END $$;");
        }

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('first_name', 100);
            $table->string('middle_name', 100)->nullable();
            $table->string('last_name', 100);
            $table->string('email', 255)->unique();
            $table->string('password', 255);
            $table->string('department', 100)->nullable();
            $table->timestampsTz();
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE users ADD COLUMN role user_role NOT NULL DEFAULT 'employee'");
            DB::statement("ALTER TABLE users ADD COLUMN status user_status NOT NULL DEFAULT 'active'");
        } else {
            Schema::table('users', function (Blueprint $table) {
                $table->enum('role', ['admin', 'approver', 'employee'])->default('employee');
                $table->enum('status', ['active', 'dismissed', 'suspended'])->default('active');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
        
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP TYPE IF EXISTS user_role;');
            DB::statement('DROP TYPE IF EXISTS user_status;');
        }
    }
};
