<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\Ai\OrderScorer;
use App\Services\Firebase\ActivityFeed;
use App\Services\OrderPresenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Throwable;

class OrderController extends Controller
{
    /** Action Queue: newest or riskiest first. Filter with ?status=PENDING&tier=HIGH&limit=50. */
    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'status' => ['sometimes', Rule::in(['PENDING', 'HOLD', 'CONFIRMING', 'SHIPPED', 'DELIVERED', 'RTS'])],
            'tier' => ['sometimes', Rule::in(['LOW', 'MEDIUM', 'HIGH'])],
            'limit' => ['sometimes', 'integer', 'min:1', 'max:200'],
        ]);

        $orders = Order::query()
            ->with(['items', 'latestAssessment'])
            ->when($data['status'] ?? null, fn ($q, $s) => $q->where('status', $s))
            ->when($data['tier'] ?? null, fn ($q, $t) => $q->whereHas('latestAssessment', fn ($a) => $a->where('risk_tier', $t)))
            ->orderByDesc('placed_at')
            ->limit($data['limit'] ?? 50)
            ->get();

        return response()->json(['count' => $orders->count(), 'orders' => $orders->map(OrderPresenter::summary(...))->values()]);
    }

    /**
     * The Action Queue screen: orders that still matter (not yet delivered or returned) and already have an
     * AI assessment, in full detail so the screen needs one request, not one per order.
     */
    public function queue(): JsonResponse
    {
        $orders = Order::query()
            ->whereHas('latestAssessment')
            ->whereNotIn('status', ['DELIVERED', 'RTS'])
            ->with(['customer', 'items', 'conversation', 'latestAssessment', 'decisions', 'outcome'])
            ->orderByDesc('placed_at')
            ->limit(40)
            ->get();

        return response()->json(['count' => $orders->count(), 'orders' => $orders->map(OrderPresenter::detail(...))->values()]);
    }

    /** Demo button: Gemini scores the next incoming order that has not been scored yet. */
    public function simulate(OrderScorer $scorer, ActivityFeed $feed): JsonResponse
    {
        $order = Order::query()->where('status', 'PENDING')->whereDoesntHave('riskAssessments')->orderBy('placed_at')->first();
        if (! $order) {
            return response()->json(['message' => 'No more incoming orders to score.'], 422);
        }

        try {
            $feed->scored($order, $scorer->scoreAndSave($order));
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Scoring is unavailable right now. Please try again.'], 502);
        }

        return response()->json(OrderPresenter::detail($order->refresh()));
    }

    public function show(Order $order): JsonResponse
    {
        return response()->json(OrderPresenter::detail($order));
    }

    /** Score this stored order with Gemini and save the assessment. */
    public function score(Order $order, OrderScorer $scorer, ActivityFeed $feed): JsonResponse
    {
        try {
            $feed->scored($order, $scorer->scoreAndSave($order));
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Scoring is unavailable right now. Please try again.'], 502);
        }

        return response()->json(OrderPresenter::detail($order->refresh()));
    }

    /**
     * Staff accept the AI's recommendation (send no action) or override it (send an action).
     * Every decision is logged; an override is flagged so we can see where staff disagree with the AI.
     */
    public function decide(Request $request, Order $order, ActivityFeed $feed): JsonResponse
    {
        $data = $request->validate([
            'action' => ['sometimes', Rule::in(['SHIP_NOW', 'CONFIRM_FIRST', 'HOLD'])],
            'note' => ['sometimes', 'nullable', 'string', 'max:500'],
        ]);

        $assessment = $order->latestAssessment;
        $action = $data['action'] ?? $assessment?->recommended_action;
        if (! $action) {
            return response()->json(['message' => 'This order has no AI recommendation yet. Send an action.'], 422);
        }

        $decision = $order->decisions()->create([
            'risk_assessment_id' => $assessment?->id,
            'action' => $action,
            'actor' => 'STAFF',
            'overrode_ai' => $assessment !== null && $action !== $assessment->recommended_action,
            'note' => $data['note'] ?? null,
            'decided_at' => now(),
        ]);

        $order->update(['status' => ['SHIP_NOW' => 'SHIPPED', 'CONFIRM_FIRST' => 'CONFIRMING', 'HOLD' => 'HOLD'][$action]]);
        $feed->decided($order, $decision);

        return response()->json(OrderPresenter::detail($order->refresh()));
    }
}
