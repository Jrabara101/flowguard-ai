<?php

use App\Services\Firebase\ActivityFeed;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    fakeGoogle();
    $this->withoutDefer();   // run the after-response Firestore write right away so it can be asserted
});

it('writes a scored event to Firestore without any personal data', function () {
    config(['services.firebase.activity_feed' => true, 'services.firebase.project' => 'test-project']);
    Http::fake([
        'firestore.googleapis.com/*' => Http::response(['name' => 'doc']),
        '*' => Http::response(geminiJson(validAssessment())),
    ]);
    $order = makeOrder();

    $this->postJson("/api/orders/{$order->id}/score")->assertOk();

    Http::assertSent(function ($req) use ($order) {
        if (! str_contains($req->url(), 'firestore.googleapis.com/v1/projects/test-project/databases/(default)/documents/activity')) {
            return false;
        }
        $f = $req->data()['fields'];

        return $f['type']['stringValue'] === 'scored'
            && $f['order_id']['integerValue'] === (string) $order->id
            && $f['risk_score']['integerValue'] === '78'
            && $f['risk_tier']['stringValue'] === 'HIGH'
            && isset($f['at']['timestampValue'])
            && ! str_contains($req->body(), 'Test Buyer');
    });
});

it('writes a decision event, flagging overrides', function () {
    config(['services.firebase.activity_feed' => true, 'services.firebase.project' => 'test-project']);
    Http::fake(['firestore.googleapis.com/*' => Http::response(['name' => 'doc'])]);
    $order = makeOrder();
    $order->riskAssessments()->create(validAssessment() + ['model' => 't']);

    $this->postJson("/api/orders/{$order->id}/decision", ['action' => 'SHIP_NOW'])->assertOk();

    Http::assertSent(fn ($req) => str_contains($req->url(), 'firestore')
        && $req->data()['fields']['type']['stringValue'] === 'decision'
        && $req->data()['fields']['action']['stringValue'] === 'SHIP_NOW'
        && $req->data()['fields']['overrode_ai']['booleanValue'] === true);
});

it('still answers when Firestore is down', function () {
    config(['services.firebase.activity_feed' => true]);
    Http::fake(['firestore.googleapis.com/*' => Http::response('down', 503)]);
    $order = makeOrder();
    $order->riskAssessments()->create(validAssessment() + ['model' => 't']);

    $this->postJson("/api/orders/{$order->id}/decision", [])->assertOk();
});

it('writes nothing when the feed is switched off', function () {
    Http::fake();
    $order = makeOrder();
    $order->riskAssessments()->create(validAssessment() + ['model' => 't']);

    $this->postJson("/api/orders/{$order->id}/decision", [])->assertOk();

    Http::assertNothingSent();
});

it('maps PHP values to Firestore typed values', function () {
    expect(ActivityFeed::fields(['a' => 1, 'b' => 1.5, 'c' => true, 'd' => 'x', 'e' => null]))->toBe([
        'a' => ['integerValue' => '1'],
        'b' => ['doubleValue' => 1.5],
        'c' => ['booleanValue' => true],
        'd' => ['stringValue' => 'x'],
        'e' => ['nullValue' => null],
    ]);
});
