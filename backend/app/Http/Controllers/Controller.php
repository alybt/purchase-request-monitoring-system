<?php

namespace App\Http\Controllers;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

abstract class Controller
{
    /**
     * Compute the assigned fiscal year for a given date.
     * Calendar year cycle:
     * - January to December: Fiscal Year = Calendar Year
     */
    public static function getFiscalYear($date = null)
    {
        $carbon = $date ? Carbon::parse($date) : now();
        return $carbon->year;
    }

    /**
     * Get the database-agnostic SQL expression to calculate the fiscal year
     * of the `created_at` column.
     */
    public static function getFiscalYearSqlExpression()
    {
        $driver = DB::getDriverName();
        if ($driver === 'sqlite') {
            return "CAST(strftime('%Y', created_at) AS INTEGER)";
        } elseif ($driver === 'pgsql') {
            return "EXTRACT(YEAR FROM created_at)";
        } else {
            // mysql/mariadb/etc.
            return "YEAR(created_at)";
        }
    }

    /**
     * Compute the budget for a selected period (annual vs monthly).
     * If month is null (All Months), returns the annual budget.
     * If a month is selected (1-12), returns the annual budget divided by 12.
     */
    public static function calculateBudgetForPeriod(float $annualBudget, ?int $month): float
    {
        if ($month === null) {
            return $annualBudget;
        }
        return $annualBudget / 12;
    }
}
