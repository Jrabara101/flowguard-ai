<?php

use App\Models\Order;
use Illuminate\Support\Facades\Http;

beforeEach(fn () => fakeGoogle());

function contractBody(array $order = []): array
{
    return [
        'order' => $order + [
            'id' => 1042, 'channel' => 'META_SHOP', 'amount' => 1499, 'payment_type' => 'COD',
            'items' => [['name' => 'Wireless Earbuds', 'quantity' => 1, 'price' => 1499]],
            'address' => 'Blk 5 Lot 8, Brgy. San Isidro, Quezon City',
            'customer' => ['phone_hash' => 'sha256:abc123', 'total_orders' => 3, 'delivered_count' => 2, 'rts_count' => 1],
            'conversation' => [
                ['sender' => 'BUYER', 'message' => 'Magkano po?'],
                ['sender' => 'SELLER', 'message' => '1499 po COD.'],
                ['sender' => 'BUYER', 'message' => 'Pwede next week na lang delivery?'],
            ],
        ],
        'history_signals' => ['past_rts_count' => 1, 'order_value_vs_customer_average' => 1.4, 'is_repeat_phone' => true, 'is_cod' => true],
    ];
}

it('scores an order in the contract shape', function () {
    Http::fake(['*' => Http::response(geminiJson(validAssessment()))]);

    $this->postJson('/api/ai/score-order', contractBody())
        ->assertOk()
        ->assertJsonPath('risk_score', 78)
        ->assertJsonPath('risk_tier', 'HIGH')
        ->assertJsonPath('buyer_intent', 'HESITANT')
        ->assertJsonPath('recommended_action', 'HOLD')
        ->assertJsonPath('parsed_address.barangay', 'San Isidro')
        ->assertJsonStructure(['risk_score', 'risk_tier', 'reasons', 'buyer_intent', 'key_moments', 'parsed_address', 'recommended_action', 'confirmation_message', 'confidence']);
});

it('sends the order, signals and chat to the Flash model with a JSON schema', function () {
    Http::fake(['*' => Http::response(geminiJson(validAssessment()))]);

    $this->postJson('/api/ai/score-order', contractBody())->assertOk();

    Http::assertSent(function ($req) {
        $sent = $req->data();

        return str_contains($req->url(), config('services.vertex.flash_model').':generateContent')
            && $req->hasHeader('Authorization', 'Bearer test-token')
            && $sent['generationConfig']['responseMimeType'] === 'application/json'
            && isset($sent['generationConfig']['responseSchema']['properties']['risk_score'])
            && str_contains($sent['contents'][0]['parts'][0]['text'], 'Pwede next week na lang delivery?')
            && str_contains($sent['contents'][0]['parts'][0]['text'], '"past_rts_count":1');
    });
});

it('corrects a tier that disagrees with the score before replying', function () {
    Http::fake(['*' => Http::response(geminiJson(validAssessment(['risk_score' => 20, 'risk_tier' => 'HIGH', 'recommended_action' => 'HOLD'])))]);

    $this->postJson('/api/ai/score-order', contractBody())
        ->assertOk()
        ->assertJsonPath('risk_tier', 'LOW')
        ->assertJsonPath('recommended_action', 'SHIP_NOW');
});

it('saves the assessment when the order exists', function () {
    Http::fake(['*' => Http::response(geminiJson(validAssessment()))]);
    $order = makeOrder();

    $this->postJson('/api/ai/score-order', contractBody(['id' => $order->id]))->assertOk();

    expect($order->riskAssessments()->count())->toBe(1)
        ->and($order->riskAssessments()->first()->risk_score)->toBe(78);
});

it('does not save anything for an order we do not store', function () {
    Http::fake(['*' => Http::response(geminiJson(validAssessment()))]);

    $this->postJson('/api/ai/score-order', contractBody(['id' => 987654]))->assertOk();

    expect(\App\Models\RiskAssessment::count())->toBe(0);
});

it('asks Gemini again once when the JSON is invalid, then succeeds', function () {
    Http::fakeSequence()
        ->push(geminiJson('this is not json'))
        ->push(geminiJson(validAssessment()));

    $this->postJson('/api/ai/score-order', contractBody())->assertOk()->assertJsonPath('risk_score', 78);

    Http::assertSentCount(2);
});

it('returns 502 and saves nothing when Gemini keeps returning bad JSON', function () {
    Http::fake(['*' => Http::response(geminiJson(validAssessment(['risk_score' => 500])))]);
    $order = makeOrder();

    $this->postJson('/api/ai/score-order', contractBody(['id' => $order->id]))
        ->assertStatus(502)
        ->assertJsonMissingPath('risk_score');

    expect($order->riskAssessments()->count())->toBe(0);
});

it('returns 502 without leaking details when Gemini is down', function () {
    Http::fake(['*' => Http::response(['error' => ['message' => 'secret internal detail']], 500)]);

    $this->postJson('/api/ai/score-order', contractBody())
        ->assertStatus(502)
        ->assertJsonMissing(['secret internal detail']);
});

it('validates the request', function () {
    Http::fake();

    $this->postJson('/api/ai/score-order', ['order' => ['amount' => 100]])->assertUnprocessable()->assertJsonValidationErrors(['order.address']);
    $this->postJson('/api/ai/score-order', contractBody(['payment_type' => 'BARTER']))->assertUnprocessable();

    Http::assertNothingSent();
});

it('scores a stored order from the database, including history signals', function () {
    Http::fake(['*' => Http::response(geminiJson(validAssessment()))]);

    $customer = \App\Models\Customer::create(['name' => 'Repeat Buyer', 'phone_hash' => hash('sha256', 'x')]);
    makeOrder(['placed_at' => now()->subDays(20), 'amount' => 1000], 'RTS', customer: $customer);
    makeOrder(['placed_at' => now()->subDays(10), 'amount' => 1000], 'DELIVERED', customer: $customer);
    $order = makeOrder(['amount' => 1500], customer: $customer);
    $order->conversation()->create(['sender' => 'BUYER', 'message' => 'Sige po kukunin ko', 'sent_at' => now()]);

    $this->postJson("/api/orders/{$order->id}/score")
        ->assertOk()
        ->assertJsonPath('risk_assessment.risk_score', 78);

    $signals = $order->riskAssessments()->first()->signals;
    expect($signals['past_rts_count'])->toBe(1)
        ->and($signals['delivered_count'])->toBe(1)
        ->and($signals['order_value_vs_customer_average'])->toBe(1.5)
        ->and($signals['is_repeat_phone'])->toBeTrue();

    // The buyer's real phone number or name never goes to Gemini.
    Http::assertSent(fn ($r) => ! str_contains(json_encode($r->data()), 'Repeat Buyer'));
});

it('rate limits the AI route', function () {
    Http::fake(['*' => Http::response(geminiJson(validAssessment()))]);

    foreach (range(1, 30) as $_) {
        $this->postJson('/api/ai/score-order', contractBody())->assertOk();
    }
    $this->postJson('/api/ai/score-order', contractBody())->assertStatus(429);
});

it('forgets a cached Google token that was rejected with a 401', function () {
    config(['services.vertex.access_token' => null]);
    \Illuminate\Support\Facades\Cache::put('vertex.access_token', 'stale-token', 600);
    Http::fakeSequence()
        ->push(['error' => ['message' => 'invalid authentication credentials']], 401)
        ->push(geminiJson(validAssessment()));

    // Whether the retry then finds fresh credentials depends on the machine, so only the 401 handling is asserted.
    $this->postJson('/api/ai/score-order', contractBody());

    Http::assertSent(fn ($r) => $r->hasHeader('Authorization', 'Bearer stale-token'));
    expect(\Illuminate\Support\Facades\Cache::get('vertex.access_token'))->not->toBe('stale-token');
});
