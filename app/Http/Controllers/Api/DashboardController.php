<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\BacktestReport;
use App\Services\Copilot\CopilotTools;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/** Everything the Analytics Dashboard shows, computed from the database. Nothing here is hard-coded. */
class DashboardController extends Controller
{
    public function __invoke(BacktestReport $backtest, CopilotTools $tools): JsonResponse
    {
        $range = ['date_range' => ['from' => now()->subDays(90)->toDateString(), 'to' => now()->toDateString()]];

        return response()->json([
            'overall' => $this->overall(),
            'backtest' => $backtest->build(),
            'weekly' => $this->weekly(),
            'routes' => array_slice($tools->regionTrends($range)['regions'], 0, 8),
            'products' => array_slice($tools->productRtsRate($range)['products'], 0, 8),
            'queue' => $this->queue(),
            'data_note' => 'Synthetic data for demonstration. No real customers.',
        ]);
    }

    /** All resolved past orders: the shop's real RTS rate and the shipping money lost to returns. */
    private function overall(): array
    {
        $row = DB::table('orders')
            ->join('outcomes', 'outcomes.order_id', '=', 'orders.id')
            ->selectRaw("count(*) as total, sum(case when outcomes.result = 'RTS' then 1 else 0 end) as rts, coalesce(sum(outcomes.shipping_loss), 0) as loss, min(orders.placed_at) as first, max(orders.placed_at) as last")
            ->first();

        $total = (int) $row->total;

        return [
            'resolved_orders' => $total,
            'rts_orders' => (int) $row->rts,
            'rts_rate' => $total ? round($row->rts / $total * 100, 1) : 0.0,
            'shipping_lost_php' => round((float) $row->loss, 2),
            'from' => $row->first ? substr($row->first, 0, 10) : null,
            'to' => $row->last ? substr($row->last, 0, 10) : null,
        ];
    }

    /**
     * Weekly RTS rate of every resolved order (the problem FlowGuard targets). Weeks with fewer than 20 orders are left out
     * so a partial week doesn't show a misleading rate. The "with FlowGuard" comparison lives in the backtest, not here:
     * about 10 scored orders a week is too few for a weekly rate.
     */
    private function weekly(): array
    {
        $orders = Order::query()
            ->whereHas('outcome')
            ->where('placed_at', '>=', now()->subWeeks(10)->startOfWeek())
            ->with('outcome')
            ->get(['id', 'placed_at']);

        return $orders
            ->groupBy(fn ($o) => $o->placed_at->copy()->startOfWeek()->toDateString())
            ->sortKeys()
            ->filter(fn ($week) => $week->count() >= 20)
            ->map(fn ($week, $start) => [
                'week_start' => $start,
                'orders' => $week->count(),
                'rts_orders' => $week->filter(fn ($o) => $o->outcome->result === 'RTS')->count(),
                'rts_rate' => round($week->filter(fn ($o) => $o->outcome->result === 'RTS')->count() / $week->count() * 100, 1),
            ])
            ->values()
            ->all();
    }

    /** Live Action Queue: open orders Gemini has scored, by tier. */
    private function queue(): array
    {
        $open = Order::query()->whereNotIn('status', ['DELIVERED', 'RTS'])->whereHas('latestAssessment')->with('latestAssessment')->get();

        return [
            'scored' => $open->count(),
            'awaiting_decision' => $open->where('status', 'PENDING')->count(),
            'by_tier' => collect(['LOW', 'MEDIUM', 'HIGH'])->mapWithKeys(fn ($t) => [$t => $open->filter(fn ($o) => $o->latestAssessment->risk_tier === $t)->count()])->all(),
        ];
    }
}
