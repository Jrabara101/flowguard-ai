<?php

use App\Services\Ai\ScoreValidator;

beforeEach(fn () => $this->v = new ScoreValidator);

it('accepts a valid assessment and cleans it', function () {
    [$a, $notes] = $this->v->validate(validAssessment());

    expect($a['risk_score'])->toBe(78)
        ->and($a['risk_tier'])->toBe('HIGH')
        ->and($a['recommended_action'])->toBe('HOLD')
        ->and($a['parsed_address']['street'])->toBeNull()      // empty strings become null
        ->and($a['parsed_address']['barangay'])->toBe('San Isidro')
        ->and($notes)->toBe([]);
});

it('makes tier and action follow the score', function (int $score, string $tier, string $action) {
    [$a] = $this->v->validate(validAssessment([
        'risk_score' => $score, 'risk_tier' => 'LOW', 'recommended_action' => 'SHIP_NOW',
        'parsed_address' => ['missing_fields' => []] + validAssessment()['parsed_address'],
    ]));

    expect($a['risk_tier'])->toBe($tier)->and($a['recommended_action'])->toBe($action);
})->with([
    'low' => [12, 'LOW', 'SHIP_NOW'],
    'edge low' => [30, 'LOW', 'SHIP_NOW'],
    'medium' => [31, 'MEDIUM', 'CONFIRM_FIRST'],
    'edge medium' => [65, 'MEDIUM', 'CONFIRM_FIRST'],
    'high' => [66, 'HIGH', 'HOLD'],
]);

it('records what it corrected', function () {
    [, $notes] = $this->v->validate(validAssessment(['risk_score' => 78, 'risk_tier' => 'MEDIUM', 'recommended_action' => 'CONFIRM_FIRST',
        'parsed_address' => ['missing_fields' => []] + validAssessment()['parsed_address']]));

    expect($notes)->toHaveCount(2);   // the tier and the action
});

it('lets a HIGH order with a fixable address gap stay CONFIRM_FIRST', function () {
    [$a] = $this->v->validate(validAssessment(['recommended_action' => 'CONFIRM_FIRST']));   // missing_fields: ['landmark']

    expect($a['risk_tier'])->toBe('HIGH')->and($a['recommended_action'])->toBe('CONFIRM_FIRST');
});

it('rejects bad Gemini output', function (array $over, string $why) {
    expect(fn () => $this->v->validate(validAssessment($over)))->toThrow(InvalidArgumentException::class);
})->with([
    'score too high' => [['risk_score' => 140], 'range'],
    'score not a number' => [['risk_score' => 'high'], 'type'],
    'unknown intent' => [['buyer_intent' => 'ANGRY'], 'enum'],
    'unknown confidence' => [['confidence' => 'SURE'], 'enum'],
    'no reasons' => [['reasons' => []], 'empty'],
    'blank reason' => [['reasons' => ['ok', ' ']], 'blank'],
    'no message' => [['confirmation_message' => ''], 'message'],
    'address not an object' => [['parsed_address' => 'Quezon City'], 'address'],
]);

it('rejects something that is not an object', function () {
    expect(fn () => $this->v->validate('nope'))->toThrow(InvalidArgumentException::class);
});

it('keeps at most three key moments', function () {
    [$a] = $this->v->validate(validAssessment(['key_moments' => ['a', 'b', 'c', 'd', 'e']]));

    expect($a['key_moments'])->toHaveCount(3);
});
