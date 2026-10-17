<?php

beforeEach(fn () => fakeGoogle());

function scoredPast(string $outcome, string $tier, int $score): void
{
    $o = makeOrder(['placed_at' => now()->subDays(5)], $outcome);
    $o->riskAssessments()->create(validAssessment(['risk_score' => $score, 'risk_tier' => $tier]) + ['model' => 'gemini-test']);
}

it('reports real numbers from the database, including the backtest', function () {
    scoredPast('RTS', 'HIGH', 80);
    scoredPast('DELIVERED', 'HIGH', 70);
    scoredPast('DELIVERED', 'LOW', 10);
    scoredPast('RTS', 'LOW', 20);
    makeOrder(['placed_at' => now()->subDays(5)], 'DELIVERED');   // resolved but never scored

    $res = $this->getJson('/api/dashboard')->assertOk();

    expect($res->json('overall'))->toMatchArray(['resolved_orders' => 5, 'rts_orders' => 2, 'rts_rate' => 40])
        ->and($res->json('backtest.scored_orders'))->toBe(4)
        ->and($res->json('backtest.by_tier.HIGH'))->toMatchArray(['orders' => 2, 'rts' => 1])
        ->and($res->json('backtest.if_high_orders_were_held.share_of_all_rts_caught_pct'))->toEqual(50)
        // Shipped = the two LOW orders, one of which returned
        ->and($res->json('backtest.if_high_orders_were_held.rts_rate_of_orders_shipped'))->toEqual(50)
        ->and($res->json('routes.0.city'))->toBe('Bacoor')
        ->and($res->json('products.0.product_name'))->toBe('Wireless Earbuds');
});

it('works before any backtest has been run', function () {
    makeOrder([], 'DELIVERED');

    $this->getJson('/api/dashboard')
        ->assertOk()
        ->assertJsonPath('backtest', null)
        ->assertJsonPath('overall.resolved_orders', 1);
});

it('leaves out weeks with too few orders to give a fair rate', function () {
    foreach (range(1, 25) as $i) {
        makeOrder(['placed_at' => now()->subWeeks(2)->startOfWeek()->addDay()], $i <= 5 ? 'RTS' : 'DELIVERED');
    }
    makeOrder(['placed_at' => now()->subWeek()->startOfWeek()->addDay()], 'RTS');   // a week with one order

    $weekly = $this->getJson('/api/dashboard')->json('weekly');

    expect($weekly)->toHaveCount(1)
        ->and($weekly[0])->toMatchArray(['orders' => 25, 'rts_orders' => 5, 'rts_rate' => 20]);
});
