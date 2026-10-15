<?php

namespace App\Services\Copilot;

use App\Models\Order;
use App\Models\RiskAssessment;
use App\Services\OrderPresenter;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * The read-only data tools Gemini can call. They only ever SELECT, so the Copilot cannot change anything.
 * Names, inputs and outputs follow docs/backend_api_contract.md.
 */
class CopilotTools
{
    /** Gemini function declarations (OpenAPI subset). */
    public static function declarations(): array
    {
        $range = [
            'type' => 'OBJECT',
            'description' => 'Inclusive date range, YYYY-MM-DD. Defaults to the last 30 days when omitted.',
            'properties' => [
                'from' => ['type' => 'STRING', 'description' => 'Start date, YYYY-MM-DD'],
                'to' => ['type' => 'STRING', 'description' => 'End date, YYYY-MM-DD'],
            ],
        ];

        return [[
            'functionDeclarations' => [
                [
                    'name' => 'get_rts_summary',
                    'description' => 'Overall return-to-sender performance: total orders, RTS orders, RTS rate and the shipping cost lost to RTS, for a date range.',
                    'parameters' => ['type' => 'OBJECT', 'properties' => ['date_range' => $range]],
                ],
                [
                    'name' => 'get_orders_by_risk',
                    'description' => 'Orders that FlowGuard scored into a risk tier (LOW, MEDIUM or HIGH) in a date range, highest risk first.',
                    'parameters' => ['type' => 'OBJECT', 'properties' => [
                        'tier' => ['type' => 'STRING', 'enum' => ['LOW', 'MEDIUM', 'HIGH']],
                        'date_range' => $range,
                    ], 'required' => ['tier']],
                ],
                [
                    'name' => 'get_product_rts_rate',
                    'description' => 'RTS rate for each product in a date range, worst first.',
                    'parameters' => ['type' => 'OBJECT', 'properties' => ['date_range' => $range]],
                ],
                [
                    'name' => 'get_region_trends',
                    'description' => 'RTS rate and average risk score by city and province in a date range. This describes courier delivery performance on a route, not the people who live there.',
                    'parameters' => ['type' => 'OBJECT', 'properties' => ['date_range' => $range]],
                ],
                [
                    'name' => 'get_order_details',
                    'description' => 'Everything about one order: its details, AI risk assessment with reasons, and the staff decision history. Use it to explain why an order is on hold.',
                    'parameters' => ['type' => 'OBJECT', 'properties' => ['order_id' => ['type' => 'INTEGER']], 'required' => ['order_id']],
                ],
            ],
        ]];
    }

    /** @throws InvalidArgumentException for an unknown tool or bad arguments */
    public function call(string $name, array $args): array
    {
        return match ($name) {
            'get_rts_summary' => $this->rtsSummary($args),
            'get_orders_by_risk' => $this->ordersByRisk($args),
            'get_product_rts_rate' => $this->productRtsRate($args),
            'get_region_trends' => $this->regionTrends($args),
            'get_order_details' => $this->orderDetails($args),
            default => throw new InvalidArgumentException("Unknown tool {$name}"),
        };
    }

    public function rtsSummary(array $args): array
    {
        [$from, $to] = $this->range($args);

        $row = DB::table('orders')
            ->join('outcomes', 'outcomes.order_id', '=', 'orders.id')
            ->whereBetween('orders.placed_at', [$from, $to])
            ->selectRaw("count(*) as total, sum(case when outcomes.result = 'RTS' then 1 else 0 end) as rts, coalesce(sum(outcomes.shipping_loss), 0) as loss")
            ->first();

        $total = (int) $row->total;
        $rts = (int) $row->rts;

        return [
            'date_range' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'total_orders' => $total,
            'rts_orders' => $rts,
            'rts_rate' => $total ? round($rts / $total * 100, 2) : 0.0,
            // Shipping paid out and back on parcels that returned: the money RTS prevention goes after.
            'estimated_savings' => (float) $row->loss,
        ];
    }

    public function ordersByRisk(array $args): array
    {
        [$from, $to] = $this->range($args);
        $tier = $args['tier'] ?? null;
        if (! in_array($tier, ['LOW', 'MEDIUM', 'HIGH'], true)) {
            throw new InvalidArgumentException('tier must be LOW, MEDIUM or HIGH.');
        }

        $latest = RiskAssessment::query()->selectRaw('max(id) as id')->groupBy('order_id');
        $rows = RiskAssessment::query()
            ->whereIn('risk_assessments.id', $latest)
            ->where('risk_tier', $tier)
            ->join('orders', 'orders.id', '=', 'risk_assessments.order_id')
            ->whereBetween('orders.placed_at', [$from, $to])
            ->orderByDesc('risk_score')
            ->get(['orders.id as order_id', 'risk_score', 'risk_tier', 'recommended_action', 'orders.amount']);

        return [
            'tier' => $tier,
            'count' => $rows->count(),
            'orders' => $rows->take(25)->map(fn ($r) => [
                'order_id' => $r->order_id,
                'risk_score' => $r->risk_score,
                'risk_tier' => $r->risk_tier,
                'recommended_action' => $r->recommended_action,
                'amount' => (float) $r->amount,
            ])->values()->all(),
        ];
    }

    public function productRtsRate(array $args): array
    {
        [$from, $to] = $this->range($args);

        $rows = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('outcomes', 'outcomes.order_id', '=', 'orders.id')
            ->whereBetween('orders.placed_at', [$from, $to])
            ->groupBy('order_items.product_id', 'order_items.product_name')
            ->selectRaw("order_items.product_id, order_items.product_name, count(distinct orders.id) as total, sum(case when outcomes.result = 'RTS' then 1 else 0 end) as rts")
            ->get();

        return ['products' => $rows->map(fn ($r) => [
            'product_id' => $r->product_id,
            'product_name' => $r->product_name,
            'total_orders' => (int) $r->total,
            'rts_orders' => (int) $r->rts,
            'rts_rate' => $r->total ? round($r->rts / $r->total * 100, 2) : 0.0,
        ])->sortByDesc('rts_rate')->values()->all()];
    }

    public function regionTrends(array $args): array
    {
        [$from, $to] = $this->range($args);

        $rows = DB::table('orders')
            ->join('outcomes', 'outcomes.order_id', '=', 'orders.id')
            ->leftJoin('risk_assessments', 'risk_assessments.order_id', '=', 'orders.id')
            ->whereBetween('orders.placed_at', [$from, $to])
            ->whereNotNull('orders.city')
            ->groupBy('orders.province', 'orders.city')
            ->selectRaw("orders.province, orders.city, count(distinct orders.id) as total, count(distinct case when outcomes.result = 'RTS' then orders.id end) as rts, avg(risk_assessments.risk_score) as avg_risk")
            ->get();

        return ['regions' => $rows->map(fn ($r) => [
            'province' => $r->province,
            'city' => $r->city,
            'total_orders' => (int) $r->total,
            'rts_orders' => (int) $r->rts,
            'rts_rate' => $r->total ? round($r->rts / $r->total * 100, 2) : 0.0,
            'average_risk_score' => $r->avg_risk !== null ? (int) round($r->avg_risk) : null,
        ])->sortByDesc('rts_rate')->values()->all()];
    }

    public function orderDetails(array $args): array
    {
        $order = Order::find((int) ($args['order_id'] ?? 0));
        if (! $order) {
            return ['error' => 'No order found with that id.'];
        }

        $d = OrderPresenter::detail($order);

        return [
            'order' => collect($d['order'])->only(['id', 'channel', 'amount', 'payment_type', 'status', 'city', 'province'])->all(),
            'risk_assessment' => $d['risk_assessment']
                ? collect($d['risk_assessment'])->only(['risk_score', 'risk_tier', 'buyer_intent', 'reasons', 'recommended_action', 'confidence'])->all()
                : null,
            'decision_history' => collect($d['decision_history'])
                ->map(fn ($h) => collect($h)->only(['action', 'actor', 'overrode_ai', 'timestamp'])->all())
                ->all(),
        ];
    }

    /** @return array{0: Carbon, 1: Carbon} */
    private function range(array $args): array
    {
        $r = $args['date_range'] ?? [];
        try {
            $to = isset($r['to']) ? Carbon::parse($r['to'])->endOfDay() : now()->endOfDay();
            $from = isset($r['from']) ? Carbon::parse($r['from'])->startOfDay() : $to->copy()->subDays(30)->startOfDay();
        } catch (\Throwable) {
            throw new InvalidArgumentException('date_range must use YYYY-MM-DD dates.');
        }
        if ($from->gt($to)) {
            [$from, $to] = [$to->copy()->startOfDay(), $from->copy()->endOfDay()];
        }

        return [$from, $to];
    }
}
