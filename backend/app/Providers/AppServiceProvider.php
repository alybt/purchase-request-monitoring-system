<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Http\Request;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Define dual rate limiter for login attempts
        RateLimiter::for('login', function (Request $request) {
            return [
                // limit 1: max 5 attempts per minute per IP address
                Limit::perMinute(5)->by($request->ip()),

                // limit 2: max 10 attempts per email (to prevent distributed attacks)
                Limit::perMinute(10)->by($request->email),
            ];
        });
    }
}
