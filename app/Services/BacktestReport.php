<?php

namespace App\Services;

use App\Models\Order;

/**
 * "If FlowGuard had held the HIGH orders, how much would we have saved?"
 * Compares Gemini's advice on past orders with what really happened to them.
 * Used by `php artisan flowguard:backtest` and the dashboard, so both always show the same numbers.
 */
class BacktestReport
{
    public function build(): ?array
    {
        $rows = Order::query()
            ->whereHas('outcome')
            ->whereHas('latestAssessment')
            ->with(['outcome', 'latestAssessment'])
            ->get();

        if ($rows->isEmpty()) {
            return null;
        }

        $total = $rows->count();
        $rtsAll = $rows->filter(fn ($o) => $o->outcome->result === 'RTS');
        $tiers = [];
        foreach (['LOW', 'MEDIUM', 'HIGH'] as $tier) {
            $g = $rows->filter(fn ($o) => $o->latestAssessment->risk_tier === $tier);
            $rts = $g->filter(fn ($o) => $o->outcome->result === 'RTS');
            $tiers[$tier] = [
                'orders' => $g->count(),
                'rts' => $rts->count(),
                'rts_rate' => $g->count() ? round($rts->count() / $g->count() * 100, 1) : 0.0,
            ];
        }

        $held = $rows->filter(fn ($o) => $o->latestAssessment->risk_tier === 'HIGH');
        $heldRts = $held->filter(fn ($o) => $o->outcome->result === 'RTS');
        $saved = (float) $heldRts->sum(fn ($o) => $o->outcome->shipping_loss);
        $atRisk = (float) $heldRts->sum(fn ($o) => (float) $o->amount);
        $shipped = $rows->filter(fn ($o) => $o->latestAssessment->risk_tier !== 'HIGH');

        // Scale the sample up to the whole order book so the peso figure is meaningful.
        $allResolved = Order::whereHas('outcome')->count();
        $scale = $total ? $allResolved / $total : 1;

        return [
            'scored_orders' => $total,
            'overall_rts_rate' => round($rtsAll->count() / $total * 100, 1),
            'by_tier' => $tiers,
            'if_high_orders_were_held' => [
                'orders_held' => $held->count(),
                'orders_held_pct' => round($held->count() / $total * 100, 1),
                'of_which_would_have_returned' => $heldRts->count(),
                'precision_pct' => $held->count() ? round($heldRts->count() / $held->count() * 100, 1) : 0.0,
                'share_of_all_rts_caught_pct' => $rtsAll->count() ? round($heldRts->count() / $rtsAll->count() * 100, 1) : 0.0,
                'rts_rate_of_orders_shipped' => $shipped->count() ? round($shipped->filter(fn ($o) => $o->outcome->result === 'RTS')->count() / $shipped->count() * 100, 1) : 0.0,
                'shipping_saved_php' => round($saved, 2),
                'cod_value_protected_php' => round($atRisk, 2),
                'delivered_orders_held_for_confirmation' => $held->count() - $heldRts->count(),
            ],
            'extrapolated_to_all_orders' => [
                'orders_in_book' => $allResolved,
                'shipping_saved_php' => round($saved * $scale),
            ],
            'models' => $rows->pluck('latestAssessment.model')->unique()->values()->all(),
            'note' => 'Synthetic data. Held orders are confirmed with the buyer first, not cancelled.',
        ];
    }
}
