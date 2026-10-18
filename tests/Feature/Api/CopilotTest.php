<?php

use App\Services\Copilot\CopilotTools;
use Illuminate\Support\Facades\Http;

beforeEach(fn () => fakeGoogle());

function toolCall(string $name, array $args): array
{
    return ['modelVersion' => 'gemini-test', 'candidates' => [['content' => ['role' => 'model', 'parts' => [
        ['functionCall' => ['name' => $name, 'args' => $args], 'thoughtSignature' => 'sig-123'],
    ]]]]];
}

function seedRtsData(): void
{
    // Cavite: 2 of 4 returned (50%). Laguna: 0 of 2.
    foreach (['RTS', 'RTS', 'DELIVERED', 'DELIVERED'] as $o) {
        makeOrder(['province' => 'Cavite'], $o, city: 'Bacoor');
    }
    foreach (['DELIVERED', 'DELIVERED'] as $o) {
        makeOrder(['province' => 'Laguna'], $o, city: 'Santa Rosa', product: 'Phone Case');
    }
}

it('calls a tool, feeds the real result back to Gemini and returns the answer', function () {
    seedRtsData();
    Http::fakeSequence()
        ->push(toolCall('get_region_trends', ['date_range' => ['from' => now()->subWeek()->toDateString(), 'to' => now()->toDateString()]]))
        ->push(geminiJson('Bacoor had the highest RTS rate at 50.0% (2 of 4 orders).'));

    $this->postJson('/api/ai/copilot', ['message' => 'Which provinces had the highest RTS rate this week?'])
        ->assertOk()
        ->assertJsonPath('answer', 'Bacoor had the highest RTS rate at 50.0% (2 of 4 orders).')
        ->assertJsonPath('tools_used', ['get_region_trends'])
        ->assertJsonPath('data.regions.0.city', 'Bacoor')
        ->assertJsonPath('data.regions.0.rts_rate', 50);

    // The second request carries the tool's real result and the model's signed turn, unchanged.
    $requests = Http::recorded();
    $second = $requests[1][0]->data();
    expect($second['contents'])->toHaveCount(3)
        ->and($second['contents'][1]['parts'][0]['thoughtSignature'])->toBe('sig-123')
        ->and($second['contents'][2]['parts'][0]['functionResponse']['name'])->toBe('get_region_trends')
        ->and($second['contents'][2]['parts'][0]['functionResponse']['response']['result']['regions'][0]['rts_orders'])->toBe(2);
});

it('offers Gemini all five tools and tells it today\'s date and the fairness rules', function () {
    Http::fake(['*' => Http::response(geminiJson('No data needed.'))]);

    $this->postJson('/api/ai/copilot', ['message' => 'hello there'])->assertOk()->assertJsonPath('tools_used', []);

    Http::assertSent(function ($req) {
        $names = collect($req['tools'][0]['functionDeclarations'])->pluck('name')->all();

        return $names === ['get_rts_summary', 'get_orders_by_risk', 'get_product_rts_rate', 'get_region_trends', 'get_order_details']
            && str_contains($req['systemInstruction']['parts'][0]['text'], now()->timezone('Asia/Manila')->format('Y'))
            && str_contains($req['systemInstruction']['parts'][0]['text'], 'never the people who live there');
    });
});

it('echoes a tool call with no arguments back as an object, not a list', function () {
    seedRtsData();
    Http::fakeSequence()
        ->push(toolCall('get_rts_summary', []))
        ->push(geminiJson('Summary.'));

    $this->postJson('/api/ai/copilot', ['message' => 'overall summary'])->assertOk();

    // Gemini returns HTTP 400 ("Proto field is not repeating") if args is sent as [].
    expect(Http::recorded()[1][0]->body())->toContain('"args":{}')->not->toContain('"args":[]');
});

it('runs several tools in one turn and keys the data by tool name', function () {
    seedRtsData();
    $two = ['modelVersion' => 'x', 'candidates' => [['content' => ['role' => 'model', 'parts' => [
        ['functionCall' => ['name' => 'get_rts_summary', 'args' => []]],
        ['functionCall' => ['name' => 'get_product_rts_rate', 'args' => []]],
    ]]]]];
    Http::fakeSequence()->push($two)->push(geminiJson('Summary and products.'));

    $res = $this->postJson('/api/ai/copilot', ['message' => 'overview'])->assertOk();

    expect($res->json('tools_used'))->toBe(['get_rts_summary', 'get_product_rts_rate'])
        ->and($res->json('data'))->toHaveKeys(['get_rts_summary', 'get_product_rts_rate']);
});

it('tells Gemini about a bad tool call instead of crashing', function () {
    Http::fakeSequence()
        ->push(toolCall('get_orders_by_risk', ['tier' => 'EXTREME']))
        ->push(geminiJson('Tier must be LOW, MEDIUM or HIGH.'));

    $this->postJson('/api/ai/copilot', ['message' => 'show extreme orders'])->assertOk()->assertJsonPath('answer', 'Tier must be LOW, MEDIUM or HIGH.');

    expect(Http::recorded()[1][0]->data()['contents'][2]['parts'][0]['functionResponse']['response']['result'])->toHaveKey('error');
});

it('falls back to the second model when the Pro model fails', function () {
    config(['services.vertex.pro_model' => 'pro-x', 'services.vertex.pro_fallback_model' => 'fallback-y']);
    Http::fake([
        '*pro-x:generateContent' => Http::response(['error' => ['message' => 'not found']], 404),
        '*fallback-y:generateContent' => Http::response(geminiJson('Answered by the fallback.')),
    ]);

    $this->postJson('/api/ai/copilot', ['message' => 'hello there'])->assertOk()->assertJsonPath('answer', 'Answered by the fallback.');
});

it('stops a model that keeps calling tools forever', function () {
    Http::fake(['*' => Http::response(toolCall('get_rts_summary', []))]);

    $this->postJson('/api/ai/copilot', ['message' => 'loop'])->assertStatus(502);
    Http::assertSentCount(5);
});

it('returns 502 when Gemini is unreachable and validates the message', function () {
    Http::fake(['*' => Http::response('boom', 500)]);

    $this->postJson('/api/ai/copilot', ['message' => 'hello there'])->assertStatus(502);
    $this->postJson('/api/ai/copilot', [])->assertUnprocessable();
    $this->postJson('/api/ai/copilot', ['message' => str_repeat('x', 501)])->assertUnprocessable();
});

// ---- the five tools, directly ----

it('summarises RTS performance', function () {
    seedRtsData();

    $s = app(CopilotTools::class)->rtsSummary([]);

    expect($s)->toMatchArray(['total_orders' => 6, 'rts_orders' => 2, 'rts_rate' => 33.33, 'estimated_savings' => 400.0]);
});

it('respects the date range', function () {
    makeOrder(['placed_at' => '2026-10-01 10:00:00'], 'RTS');
    makeOrder(['placed_at' => '2026-10-20 10:00:00'], 'DELIVERED');

    $s = app(CopilotTools::class)->rtsSummary(['date_range' => ['from' => '2026-10-01', 'to' => '2026-10-07']]);

    expect($s['total_orders'])->toBe(1)->and($s['rts_orders'])->toBe(1);
});

it('ranks products by RTS rate', function () {
    seedRtsData();

    $p = app(CopilotTools::class)->productRtsRate([])['products'];

    expect($p[0]['product_name'])->toBe('Wireless Earbuds')
        ->and($p[0]['rts_rate'])->toBe(50.0)
        ->and($p[1]['product_name'])->toBe('Phone Case')
        ->and($p[1]['rts_rate'])->toBe(0.0);
});

it('lists orders by risk tier, highest score first', function () {
    foreach ([70, 95, 40] as $score) {
        $o = makeOrder();
        $o->riskAssessments()->create(validAssessment(['risk_score' => $score, 'risk_tier' => $score > 65 ? 'HIGH' : 'MEDIUM']) + ['model' => 't']);
    }

    $r = app(CopilotTools::class)->ordersByRisk(['tier' => 'HIGH']);

    expect($r['count'])->toBe(2)->and(array_column($r['orders'], 'risk_score'))->toBe([95, 70]);
});

it('only uses the latest assessment of an order', function () {
    $o = makeOrder();
    $o->riskAssessments()->create(validAssessment(['risk_score' => 90, 'risk_tier' => 'HIGH']) + ['model' => 't']);
    $o->riskAssessments()->create(validAssessment(['risk_score' => 20, 'risk_tier' => 'LOW', 'recommended_action' => 'SHIP_NOW']) + ['model' => 't']);

    expect(app(CopilotTools::class)->ordersByRisk(['tier' => 'HIGH'])['count'])->toBe(0);
});

it('explains one order with its assessment and decision history', function () {
    $o = makeOrder();
    $o->riskAssessments()->create(validAssessment() + ['model' => 't']);
    $o->decisions()->create(['action' => 'HOLD', 'actor' => 'STAFF', 'decided_at' => now()]);

    $d = app(CopilotTools::class)->orderDetails(['order_id' => $o->id]);

    expect($d['order']['id'])->toBe($o->id)
        ->and($d['risk_assessment']['reasons'])->toContain('Customer has a previous RTS order')
        ->and($d['decision_history'][0]['action'])->toBe('HOLD')
        ->and(app(CopilotTools::class)->orderDetails(['order_id' => 424242]))->toHaveKey('error');
});

it('rejects an unknown tool name', function () {
    expect(fn () => app(CopilotTools::class)->call('drop_all_tables', []))->toThrow(InvalidArgumentException::class);
});
