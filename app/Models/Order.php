<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'placed_at' => 'datetime',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function conversation(): HasMany
    {
        return $this->hasMany(Conversation::class)->orderBy('sent_at')->orderBy('id');
    }

    public function riskAssessments(): HasMany
    {
        return $this->hasMany(RiskAssessment::class)->latest('id');
    }

    public function latestAssessment(): HasOne
    {
        return $this->hasOne(RiskAssessment::class)->latestOfMany();
    }

    public function decisions(): HasMany
    {
        return $this->hasMany(Decision::class)->orderBy('decided_at')->orderBy('id');
    }

    public function outcome(): HasOne
    {
        return $this->hasOne(Outcome::class);
    }
}
