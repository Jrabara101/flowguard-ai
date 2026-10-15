<?php

namespace App\Services;

use App\Models\Order;

/**
 * Facts computed from our own database and sent to Gemini alongside the order.
 * Location is only ever used as the courier's delivery success rate for the area, never as a buyer trait.
 */
class HistorySignals
{
    public function forOrder(Order $order): array
    {
        $customer = $order->customer;

        $past = $customer->orders()
            ->where('id', '!=', $order->id)
            ->where('placed_at', '<', $order->placed_at)
            ->with('outcome')
            ->get();

        $delivered = $past->filter(fn ($o) => $o->outcome?->result === 'DELIVERED')->count();
        $rts = $past->filter(fn ($o) => $o->outcome?->result === 'RTS')->count();
        $avg = $past->avg('amount');

        return [
            'total_orders' => $past->count(),
            'delivered_count' => $delivered,
            'rts_count' => $rts,
            'past_rts_count' => $rts,
            'order_value_vs_customer_average' => $avg ? round((float) $order->amount / (float) $avg, 2) : null,
            'is_repeat_phone' => $past->isNotEmpty(),
            'is_cod' => $order->payment_type === 'COD',
            'area_courier_success_rate' => $this->areaSuccessRate($order),
        ];
    }

    /** Share of resolved orders to the same city that were delivered, or null if we have too few to say. */
    private function areaSuccessRate(Order $order): ?float
    {
        if (! $order->city) {
            return null;
        }

        $q = Order::query()
            ->join('outcomes', 'outcomes.order_id', '=', 'orders.id')
            ->where('orders.city', $order->city)
            ->where('orders.id', '!=', $order->id);

        $total = (clone $q)->count();
        if ($total < 20) {
            return null;
        }

        return round((clone $q)->where('outcomes.result', 'DELIVERED')->count() / $total, 2);
    }
}
