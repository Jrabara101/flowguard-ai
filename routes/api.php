<?php

use App\Http\Controllers\Api\AiController;
use App\Http\Controllers\Api\OrderController;
use Illuminate\Support\Facades\Route;

// Gemini calls cost money, so the AI routes are rate limited per IP.
Route::middleware('throttle:30,1')->prefix('ai')->group(function () {
    Route::post('score-order', [AiController::class, 'scoreOrder']);
    Route::post('copilot', [AiController::class, 'copilot']);
});

Route::get('orders', [OrderController::class, 'index']);
Route::get('orders/{order}', [OrderController::class, 'show']);
Route::middleware('throttle:30,1')->post('orders/{order}/score', [OrderController::class, 'score']);
Route::post('orders/{order}/decision', [OrderController::class, 'decide']);
