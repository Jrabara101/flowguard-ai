<?php

function assessed(string $action = 'HOLD', int $score = 78): \App\Models\Order
{
    $order = makeOrder();
    $order->riskAssessments()->create(validAssessment([
        'risk_score' => $score, 'risk_tier' => $score > 65 ? 'HIGH' : 'MEDIUM', 'recommended_action' => $action, 'confidence' => 'HIGH',
    ]) + ['model' => 'gemini-test']);

    return $order;
}

it('lets staff accept the AI recommendation with no action given', function () {
    $order = assessed('HOLD');

    $this->postJson("/api/orders/{$order->id}/decision", ['note' => 'Agree, buyer wants to delay'])
        ->assertOk()
        ->assertJsonPath('order.status', 'HOLD')
        ->assertJsonPath('decision_history.0.action', 'HOLD')
        ->assertJsonPath('decision_history.0.actor', 'STAFF')
        ->assertJsonPath('decision_history.0.overrode_ai', false);
});

it('logs an override and flags it', function () {
    $order = assessed('HOLD');

    $this->postJson("/api/orders/{$order->id}/decision", ['action' => 'SHIP_NOW', 'note' => 'Regular customer, I know them'])
        ->assertOk()
        ->assertJsonPath('order.status', 'SHIPPED')
        ->assertJsonPath('decision_history.0.overrode_ai', true)
        ->assertJsonPath('decision_history.0.note', 'Regular customer, I know them');
});

it('keeps every decision in order', function () {
    $order = assessed('CONFIRM_FIRST', 50);

    $this->postJson("/api/orders/{$order->id}/decision", [])->assertOk();
    $this->postJson("/api/orders/{$order->id}/decision", ['action' => 'SHIP_NOW'])->assertOk();

    expect($order->decisions()->pluck('action')->all())->toBe(['CONFIRM_FIRST', 'SHIP_NOW'])
        ->and($order->refresh()->status)->toBe('SHIPPED');
});

it('needs an action when the order has not been scored', function () {
    $order = makeOrder();

    $this->postJson("/api/orders/{$order->id}/decision", [])->assertUnprocessable();
    $this->postJson("/api/orders/{$order->id}/decision", ['action' => 'HOLD'])
        ->assertOk()
        ->assertJsonPath('decision_history.0.overrode_ai', false);
});

it('rejects an unknown action and an unknown order', function () {
    $order = assessed();

    $this->postJson("/api/orders/{$order->id}/decision", ['action' => 'DELETE'])->assertUnprocessable();
    $this->postJson('/api/orders/999999/decision', ['action' => 'HOLD'])->assertNotFound();
});

it('lists orders for the action queue with their risk', function () {
    $high = assessed('HOLD', 90);
    makeOrder();

    $this->getJson('/api/orders?status=PENDING')->assertOk()->assertJsonPath('count', 2);
    $this->getJson('/api/orders?tier=HIGH')
        ->assertOk()
        ->assertJsonPath('count', 1)
        ->assertJsonPath('orders.0.id', $high->id)
        ->assertJsonPath('orders.0.risk_tier', 'HIGH');
    $this->getJson('/api/orders?tier=EXTREME')->assertUnprocessable();
});

it('shows an order with its chat, assessment and decisions but not the buyer name', function () {
    $order = assessed();
    $order->conversation()->create(['sender' => 'BUYER', 'message' => 'Magkano po?', 'sent_at' => now()]);

    $res = $this->getJson("/api/orders/{$order->id}")
        ->assertOk()
        ->assertJsonPath('conversation.0.message', 'Magkano po?')
        ->assertJsonPath('risk_assessment.risk_tier', 'HIGH')
        ->assertJsonPath('order.customer.name_masked', 'T. B.');

    expect($res->getContent())->not->toContain('Test Buyer');
});
