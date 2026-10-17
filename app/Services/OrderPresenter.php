<?php

namespace App\Services;

use App\Models\Order;
use App\Models\RiskAssessment;

/** Turns models into the JSON shapes in docs/backend_api_contract.md. */
class OrderPresenter
{
    public static function assessment(?RiskAssessment $a): ?array
    {
        return $a ? [
            'id' => $a->id,
            'risk_score' => $a->risk_score,
            'risk_tier' => $a->risk_tier,
            'buyer_intent' => $a->buyer_intent,
            'reasons' => $a->reasons,
            'key_moments' => $a->key_moments ?? [],
            'parsed_address' => $a->parsed_address,
            'recommended_action' => $a->recommended_action,
            'confirmation_message' => $a->confirmation_message,
            'confidence' => $a->confidence,
            'signals' => $a->signals,
            'model' => $a->model,
            'scored_at' => $a->created_at?->toIso8601String(),
        ] : null;
    }

    public static function summary(Order $o): array
    {
        $a = $o->latestAssessment;

        return [
            'id' => $o->id,
            'channel' => $o->channel,
            'amount' => (float) $o->amount,
            'payment_type' => $o->payment_type,
            'status' => $o->status,
            'city' => $o->city,
            'province' => $o->province,
            'placed_at' => $o->placed_at->toIso8601String(),
            'items' => $o->items->map(fn ($i) => ['name' => $i->product_name, 'quantity' => $i->quantity, 'price' => (float) $i->price])->all(),
            'risk_score' => $a?->risk_score,
            'risk_tier' => $a?->risk_tier,
            'recommended_action' => $a?->recommended_action,
        ];
    }

    public static function detail(Order $o): array
    {
        $o->loadMissing(['customer', 'items', 'conversation', 'latestAssessment', 'decisions', 'outcome']);

        return [
            'order' => self::summary($o) + [
                'address' => $o->address,
                'customer' => ['name_masked' => self::mask($o->customer->name), 'phone_hash' => 'sha256:'.substr($o->customer->phone_hash, 0, 8)],
            ],
            'conversation' => $o->conversation->map(fn ($m) => [
                'sender' => $m->sender, 'message' => $m->message, 'sent_at' => $m->sent_at?->toIso8601String(),
            ])->all(),
            'risk_assessment' => self::assessment($o->latestAssessment),
            'decision_history' => $o->decisions->map(fn ($d) => [
                'action' => $d->action,
                'actor' => $d->actor,
                'overrode_ai' => $d->overrode_ai,
                'note' => $d->note,
                'timestamp' => $d->decided_at->toIso8601String(),
            ])->all(),
            'outcome' => $o->outcome ? ['result' => $o->outcome->result, 'resolved_at' => $o->outcome->resolved_at?->toIso8601String()] : null,
        ];
    }

    /** "Maria Santos" becomes "M. S." because staff don't need the full name to decide. */
    private static function mask(string $name): string
    {
        return collect(explode(' ', $name))->map(fn ($p) => mb_substr($p, 0, 1).'.')->implode(' ');
    }
}
