<?php

namespace App\Services\Ai;

use InvalidArgumentException;

/**
 * Checks Gemini's JSON before anything is saved, then makes tier and action agree with the score.
 */
class ScoreValidator
{
    public const INTENTS = ['COMMITTED', 'HESITANT', 'PRICE_SHOPPING', 'UNVERIFIED'];
    public const ACTIONS = ['SHIP_NOW', 'CONFIRM_FIRST', 'HOLD'];
    public const CONFIDENCE = ['LOW', 'MEDIUM', 'HIGH'];
    public const ADDRESS_FIELDS = ['house', 'street', 'barangay', 'city', 'province', 'zip', 'landmark'];

    /**
     * @return array{0: array, 1: list<string>} the clean assessment and notes about anything we corrected
     * @throws InvalidArgumentException when the JSON cannot be trusted
     */
    public function validate(mixed $data): array
    {
        if (! is_array($data)) {
            throw new InvalidArgumentException('Response is not a JSON object.');
        }

        $score = $data['risk_score'] ?? null;
        if (! is_numeric($score) || $score < 0 || $score > 100) {
            throw new InvalidArgumentException('risk_score must be a number from 0 to 100.');
        }
        $score = (int) round($score);

        $intent = $data['buyer_intent'] ?? null;
        if (! in_array($intent, self::INTENTS, true)) {
            throw new InvalidArgumentException('buyer_intent is not one of '.implode(', ', self::INTENTS).'.');
        }

        $confidence = $data['confidence'] ?? null;
        if (! in_array($confidence, self::CONFIDENCE, true)) {
            throw new InvalidArgumentException('confidence is not LOW, MEDIUM or HIGH.');
        }

        $reasons = $data['reasons'] ?? null;
        if (! is_array($reasons) || $reasons === [] || count($reasons) > 8 || collect($reasons)->contains(fn ($r) => ! is_string($r) || trim($r) === '')) {
            throw new InvalidArgumentException('reasons must be 1 to 8 non-empty strings.');
        }

        $message = $data['confirmation_message'] ?? null;
        if (! is_string($message) || trim($message) === '') {
            throw new InvalidArgumentException('confirmation_message is missing.');
        }

        $address = $data['parsed_address'] ?? null;
        if (! is_array($address)) {
            throw new InvalidArgumentException('parsed_address must be an object.');
        }
        $missing = array_values(array_filter((array) ($address['missing_fields'] ?? []), 'is_string'));
        $parsed = [];
        foreach (self::ADDRESS_FIELDS as $f) {
            $v = $address[$f] ?? null;
            $parsed[$f] = is_string($v) && trim($v) !== '' ? trim($v) : null;
        }
        $parsed['missing_fields'] = $missing;

        $moments = array_values(array_slice(array_filter((array) ($data['key_moments'] ?? []), 'is_string'), 0, 3));

        // Tier and action follow the score, so the numbers and the advice can never disagree.
        $notes = [];
        $tier = $score <= 30 ? 'LOW' : ($score <= 65 ? 'MEDIUM' : 'HIGH');
        if (isset($data['risk_tier']) && $data['risk_tier'] !== $tier) {
            $notes[] = "risk_tier {$data['risk_tier']} corrected to {$tier} to match score {$score}";
        }

        $action = ['LOW' => 'SHIP_NOW', 'MEDIUM' => 'CONFIRM_FIRST', 'HIGH' => 'HOLD'][$tier];
        $given = $data['recommended_action'] ?? null;
        // A HIGH order whose only problem is a fixable address gap may be CONFIRM_FIRST instead of HOLD.
        if ($tier === 'HIGH' && $given === 'CONFIRM_FIRST' && $missing !== []) {
            $action = 'CONFIRM_FIRST';
        }
        if ($given !== $action) {
            $notes[] = 'recommended_action '.($given ?? 'null')." corrected to {$action}";
        }

        return [[
            'risk_score' => $score,
            'risk_tier' => $tier,
            'reasons' => array_values(array_map('trim', $reasons)),
            'buyer_intent' => $intent,
            'key_moments' => $moments,
            'parsed_address' => $parsed,
            'recommended_action' => $action,
            'confirmation_message' => trim($message),
            'confidence' => $confidence,
        ], $notes];
    }
}
