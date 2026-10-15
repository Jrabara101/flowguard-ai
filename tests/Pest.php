<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind a different classes or traits.
|
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

function something()
{
    // ..
}

/*
| Backend tests: every Gemini call is faked, so the suite is free and offline.
*/
function fakeGoogle(): void
{
    config([
        'services.vertex.project' => 'test-project',
        'services.vertex.access_token' => 'test-token',
        'services.vertex.flash_thinking' => null,
    ]);
}

/** A Gemini reply that wraps $payload as the model's JSON text. */
function geminiJson(array|string $payload): array
{
    return ['modelVersion' => 'gemini-test', 'candidates' => [['content' => ['role' => 'model', 'parts' => [
        ['text' => is_string($payload) ? $payload : json_encode($payload)],
    ]]]]];
}

function validAssessment(array $over = []): array
{
    return $over + [
        'risk_score' => 78,
        'risk_tier' => 'HIGH',
        'reasons' => ['Customer has a previous RTS order', 'Buyer asked to postpone delivery'],
        'buyer_intent' => 'HESITANT',
        'key_moments' => ['Pwede next week na lang delivery?'],
        'parsed_address' => ['house' => 'Blk 5 Lot 8', 'street' => '', 'barangay' => 'San Isidro', 'city' => 'Quezon City', 'province' => 'Metro Manila', 'zip' => '', 'landmark' => '', 'missing_fields' => ['landmark']],
        'recommended_action' => 'HOLD',
        'confirmation_message' => 'Hi po! Please confirm po ang delivery ng order ninyo.',
        'confidence' => 'HIGH',
    ];
}

/** Create an order with a customer, an item and (optionally) a known outcome. */
function makeOrder(array $attrs = [], ?string $outcome = null, string $city = 'Bacoor', ?\App\Models\Customer $customer = null, string $product = 'Wireless Earbuds'): \App\Models\Order
{
    $customer ??= \App\Models\Customer::create(['name' => 'Test Buyer', 'phone_hash' => hash('sha256', uniqid('', true))]);
    $order = \App\Models\Order::create($attrs + [
        'customer_id' => $customer->id, 'channel' => 'META_SHOP', 'amount' => 1499, 'payment_type' => 'COD',
        'address' => 'Blk 5 Lot 8, Brgy. San Isidro, '.$city, 'province' => 'Cavite', 'city' => $city,
        'status' => $outcome ?? 'PENDING', 'placed_at' => now()->subDay(),
    ]);
    $order->items()->create(['product_id' => 'P101', 'product_name' => $product, 'quantity' => 1, 'price' => $order->amount]);
    if ($outcome) {
        $order->outcome()->create(['result' => $outcome === 'RTS' ? 'RTS' : 'DELIVERED', 'shipping_loss' => $outcome === 'RTS' ? 200 : 0, 'resolved_at' => now()]);
    }

    return $order;
}
