<?php

namespace App\Services\Firebase;

use App\Models\Decision;
use App\Models\Order;
use App\Models\RiskAssessment;
use App\Services\Ai\VertexClient;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Live activity feed in Cloud Firestore: every Gemini score and every staff decision becomes one small document
 * in the `activity` collection, which the app's browsers watch in real time (Firebase JS SDK, onSnapshot).
 *
 * Only order facts go in: order number, channel, route, score, tier, action. Never a name or phone number.
 * Writes happen after the response is sent and never fail the request: the feed is a view, Cloud SQL is the record.
 */
class ActivityFeed
{
    public function __construct(private VertexClient $google) {}

    public function scored(Order $order, RiskAssessment $a): void
    {
        $this->publish([
            'type' => 'scored',
            'order_id' => $order->id,
            'channel' => $order->channel,
            'route' => trim(($order->city ?? '').', '.($order->province ?? ''), ', '),
            'amount' => (float) $order->amount,
            'risk_score' => $a->risk_score,
            'risk_tier' => $a->risk_tier,
            'action' => $a->recommended_action,
            'model' => $a->model,
        ]);
    }

    public function decided(Order $order, Decision $d): void
    {
        $this->publish([
            'type' => 'decision',
            'order_id' => $order->id,
            'channel' => $order->channel,
            'route' => trim(($order->city ?? '').', '.($order->province ?? ''), ', '),
            'action' => $d->action,
            'overrode_ai' => (bool) $d->overrode_ai,
            'actor' => $d->actor,
        ]);
    }

    private function publish(array $event): void
    {
        if (! config('services.firebase.activity_feed')) {
            return;
        }

        $project = config('services.firebase.project');
        $event['at'] = now()->utc();

        // Runs after the HTTP response has gone out, so the user never waits for Firestore.
        defer(function () use ($project, $event) {
            try {
                Http::withToken($this->google->accessToken())
                    ->timeout(5)
                    ->post("https://firestore.googleapis.com/v1/projects/{$project}/databases/(default)/documents/activity", [
                        'fields' => self::fields($event),
                    ])
                    ->throw();
            } catch (Throwable $e) {
                report($e);
            }
        });
    }

    /** PHP values to Firestore REST typed values. */
    public static function fields(array $data): array
    {
        $out = [];
        foreach ($data as $key => $value) {
            $out[$key] = match (true) {
                $value === null => ['nullValue' => null],
                is_bool($value) => ['booleanValue' => $value],
                is_int($value) => ['integerValue' => (string) $value],
                is_float($value) => ['doubleValue' => $value],
                $value instanceof \DateTimeInterface => ['timestampValue' => $value->format('Y-m-d\TH:i:s.u\Z')],
                default => ['stringValue' => (string) $value],
            };
        }

        return $out;
    }
}
