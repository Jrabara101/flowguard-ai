<?php

namespace App\Services\Ai;

use App\Models\Order;
use App\Models\RiskAssessment;
use App\Services\HistorySignals;
use InvalidArgumentException;
use RuntimeException;

/**
 * One Gemini Flash call per order: risk, intent, address parsing, action and the buyer message.
 */
class OrderScorer
{
    public function __construct(
        private VertexClient $vertex,
        private ScoreValidator $validator,
        private HistorySignals $signals,
    ) {}

    /** Score a stored order and save the assessment. */
    public function scoreAndSave(Order $order): RiskAssessment
    {
        $order->loadMissing(['customer', 'items', 'conversation']);
        $signals = $this->signals->forOrder($order);

        $result = $this->score($this->inputFromOrder($order, $signals));

        return $order->riskAssessments()->create([
            ...$result['assessment'],
            'model' => $result['model'],
            'signals' => $signals + ['corrections' => $result['notes']],
        ]);
    }

    /**
     * Score a payload shaped like the API contract (order + history_signals), without saving.
     *
     * @return array{assessment: array, notes: list<string>, model: string|null}
     */
    public function scoreContract(array $body): array
    {
        $o = $body['order'];
        $input = [
            'order' => [
                'channel' => $o['channel'] ?? null,
                'amount' => $o['amount'],
                'payment_type' => $o['payment_type'] ?? 'COD',
                'items' => array_map(fn ($i) => [
                    'name' => $i['name'], 'quantity' => $i['quantity'] ?? 1, 'price' => $i['price'] ?? null,
                ], $o['items'] ?? []),
                'raw_address' => $o['address'],
            ],
            'signals' => ($o['customer'] ?? []) + ($body['history_signals'] ?? []),
            'conversation' => array_map(fn ($m) => [
                'sender' => $m['sender'], 'message' => $m['message'],
            ], $o['conversation'] ?? []),
        ];

        return $this->score($input);
    }

    /**
     * Score many orders at once (the backtest). Anything that fails is retried one by one.
     *
     * @param  array<int|string, array>  $inputs
     * @return array<int|string, array{assessment: array, notes: list<string>, model: string|null}|Throwable>
     */
    public function scoreMany(array $inputs, int $concurrency = 6): array
    {
        $model = config('services.vertex.flash_model');
        $responses = $this->vertex->generateMany($model, array_map($this->payload(...), $inputs), $concurrency);

        $out = [];
        foreach ($inputs as $key => $input) {
            try {
                $r = $responses[$key];
                if ($r instanceof \Throwable) {
                    throw $r;
                }
                $out[$key] = $this->parse($r, $model);
            } catch (\Throwable) {
                try {
                    $out[$key] = $this->score($input);
                } catch (\Throwable $e) {
                    $out[$key] = $e;
                }
            }
        }

        return $out;
    }

    /** @return array{assessment: array, notes: list<string>, model: string|null} */
    public function score(array $input): array
    {
        $payload = $this->payload($input);

        $model = config('services.vertex.flash_model');
        $error = null;

        // One retry: a malformed answer is usually fixed by asking again.
        for ($attempt = 1; $attempt <= 2; $attempt++) {
            try {
                return $this->parse($this->vertex->generate($model, $payload), $model);
            } catch (\JsonException|InvalidArgumentException $e) {
                $error = $e->getMessage();
            }
        }

        throw new RuntimeException("Gemini did not return a valid assessment: {$error}");
    }

    /** @return array{assessment: array, notes: list<string>, model: string|null} */
    private function parse(array $response, string $model): array
    {
        $data = json_decode(VertexClient::text($response), true, 512, JSON_THROW_ON_ERROR);
        [$assessment, $notes] = $this->validator->validate($data);

        return ['assessment' => $assessment, 'notes' => $notes, 'model' => $response['modelVersion'] ?? $model];
    }

    private function payload(array $input): array
    {
        $payload = [
            'systemInstruction' => ['parts' => [['text' => $this->systemPrompt()]]],
            'contents' => [['role' => 'user', 'parts' => [['text' => json_encode($input, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]]]],
            'generationConfig' => [
                'responseMimeType' => 'application/json',
                'responseSchema' => $this->schema(),
                'maxOutputTokens' => 4096,
            ],
        ];

        if ($level = config('services.vertex.flash_thinking')) {
            $payload['generationConfig']['thinkingConfig'] = ['thinkingLevel' => $level];
        }

        return $payload;
    }

    public function inputFromOrder(Order $order, array $signals): array
    {
        return [
            'order' => [
                'channel' => $order->channel,
                'amount' => (float) $order->amount,
                'payment_type' => $order->payment_type,
                'items' => $order->items->map(fn ($i) => [
                    'name' => $i->product_name, 'quantity' => $i->quantity, 'price' => (float) $i->price,
                ])->all(),
                'raw_address' => $order->address,
                'customer' => ['phone_hash' => 'sha256:'.substr($order->customer->phone_hash, 0, 8).'…'],
            ],
            'signals' => $signals,
            'conversation' => $order->conversation->map(fn ($m) => [
                'sender' => $m->sender, 'message' => $m->message,
            ])->all(),
        ];
    }

    private function systemPrompt(): string
    {
        return file_get_contents(resource_path('ai/scoring_system_prompt.md'));
    }

    private function schema(): array
    {
        return json_decode(file_get_contents(resource_path('ai/scoring_response_schema.json')), true);
    }
}
