<?php

use Illuminate\Support\Facades\Http;

beforeEach(fn () => fakeGoogle());

it('lists only open orders that already have an assessment, in full detail', function () {
    $scored = makeOrder();
    $scored->riskAssessments()->create(validAssessment() + ['model' => 't', 'signals' => ['past_rts_count' => 1]]);
    makeOrder();                                       // not scored yet
    $done = makeOrder([], 'DELIVERED');                // already resolved
    $done->riskAssessments()->create(validAssessment() + ['model' => 't']);

    $this->getJson('/api/queue')
        ->assertOk()
        ->assertJsonPath('count', 1)
        ->assertJsonPath('orders.0.order.id', $scored->id)
        ->assertJsonPath('orders.0.risk_assessment.risk_score', 78)
        ->assertJsonPath('orders.0.risk_assessment.signals.past_rts_count', 1)
        ->assertJsonPath('orders.0.order.customer.name_masked', 'T. B.');
});

it('scores the oldest unscored pending order when simulating', function () {
    Http::fake(['*' => Http::response(geminiJson(validAssessment()))]);
    $newer = makeOrder(['placed_at' => now()->subHour()]);
    $older = makeOrder(['placed_at' => now()->subHours(3)]);

    $this->postJson('/api/queue/simulate')
        ->assertOk()
        ->assertJsonPath('order.id', $older->id)
        ->assertJsonPath('risk_assessment.risk_score', 78);

    expect($older->riskAssessments()->count())->toBe(1)
        ->and($newer->riskAssessments()->count())->toBe(0);
});

it('says so when there is nothing left to simulate', function () {
    Http::fake();

    $this->postJson('/api/queue/simulate')->assertUnprocessable()->assertJsonPath('message', 'No more incoming orders to score.');

    Http::assertNothingSent();
});

it('returns 502 and saves nothing when Gemini fails during a simulation', function () {
    Http::fake(['*' => Http::response('boom', 500)]);
    $order = makeOrder();

    $this->postJson('/api/queue/simulate')->assertStatus(502);

    expect($order->riskAssessments()->count())->toBe(0);
});
