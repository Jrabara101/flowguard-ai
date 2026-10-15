<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\Ai\OrderScorer;
use App\Services\Copilot\CopilotService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class AiController extends Controller
{
    /**
     * POST /api/ai/score-order. Takes the payload from docs/backend_api_contract.md.
     * If order.id is an order we have stored, the assessment is saved against it.
     */
    public function scoreOrder(Request $request, OrderScorer $scorer): JsonResponse
    {
        $body = $request->validate([
            'order' => ['required', 'array'],
            'order.id' => ['sometimes', 'nullable', 'integer'],
            'order.channel' => ['sometimes', 'nullable', 'string', 'max:20'],
            'order.amount' => ['required', 'numeric', 'min:0'],
            'order.payment_type' => ['sometimes', 'in:COD,PREPAID'],
            'order.address' => ['required', 'string', 'max:500'],
            'order.items' => ['sometimes', 'array', 'max:20'],
            'order.items.*.name' => ['required', 'string', 'max:200'],
            'order.items.*.quantity' => ['sometimes', 'integer', 'min:1'],
            'order.items.*.price' => ['sometimes', 'nullable', 'numeric'],
            'order.customer' => ['sometimes', 'array'],
            'order.conversation' => ['sometimes', 'array', 'max:60'],
            'order.conversation.*.sender' => ['required', 'in:BUYER,SELLER'],
            'order.conversation.*.message' => ['required', 'string', 'max:1000'],
            'history_signals' => ['sometimes', 'array'],
        ]);

        try {
            $result = $scorer->scoreContract($body);
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'Scoring is unavailable right now. Please try again.'], 502);
        }

        $order = isset($body['order']['id']) ? Order::find($body['order']['id']) : null;
        $order?->riskAssessments()->create([
            ...$result['assessment'],
            'model' => $result['model'],
            'signals' => ($body['history_signals'] ?? []) + ['corrections' => $result['notes']],
        ]);

        return response()->json($result['assessment']);
    }

    /** POST /api/ai/copilot with {"message": "..."} */
    public function copilot(Request $request, CopilotService $copilot): JsonResponse
    {
        $data = $request->validate(['message' => ['required', 'string', 'min:2', 'max:500']]);

        try {
            return response()->json($copilot->ask($data['message']));
        } catch (Throwable $e) {
            report($e);

            return response()->json(['message' => 'The Copilot is unavailable right now. Please try again.'], 502);
        }
    }
}
