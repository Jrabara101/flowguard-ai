<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RiskAssessment extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'reasons' => 'array',
            'key_moments' => 'array',
            'parsed_address' => 'array',
            'signals' => 'array',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
