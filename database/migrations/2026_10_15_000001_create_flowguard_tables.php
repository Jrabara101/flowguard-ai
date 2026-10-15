<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            // Only a hash of the phone number is kept, never the number itself.
            $table->string('phone_hash')->unique();
            $table->timestamps();
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('channel', 20)->default('META_SHOP');   // META_SHOP, MESSENGER, TIKTOK_SHOP
            $table->decimal('amount', 10, 2);
            $table->string('payment_type', 10)->default('COD');    // COD, PREPAID
            $table->text('address');
            $table->string('province')->nullable()->index();
            $table->string('city')->nullable()->index();
            // PENDING (new, awaiting a decision), HOLD, CONFIRMING, SHIPPED, DELIVERED, RTS
            $table->string('status', 20)->default('PENDING')->index();
            $table->timestamp('placed_at')->index();
            $table->timestamps();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('product_id', 20)->index();
            $table->string('product_name');
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('price', 10, 2);
        });

        Schema::create('conversations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('sender', 10);                          // BUYER, SELLER
            $table->text('message');
            $table->timestamp('sent_at')->nullable();
        });

        Schema::create('risk_assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('risk_score');
            $table->string('risk_tier', 10)->index();              // LOW, MEDIUM, HIGH
            $table->string('buyer_intent', 20);                    // COMMITTED, HESITANT, PRICE_SHOPPING, UNVERIFIED
            $table->json('reasons');
            $table->json('key_moments')->nullable();
            $table->json('parsed_address')->nullable();
            $table->string('recommended_action', 20);              // SHIP_NOW, CONFIRM_FIRST, HOLD
            $table->text('confirmation_message')->nullable();
            $table->string('confidence', 10);                      // LOW, MEDIUM, HIGH
            $table->string('model', 60)->nullable();
            $table->json('signals')->nullable();                   // the history signals sent with the order
            $table->timestamps();
        });

        Schema::create('decisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('risk_assessment_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action', 20);                          // SHIP_NOW, CONFIRM_FIRST, HOLD
            $table->string('actor', 20)->default('STAFF');         // STAFF, SYSTEM
            $table->boolean('overrode_ai')->default(false);
            $table->text('note')->nullable();
            $table->timestamp('decided_at');
            $table->timestamps();
        });

        Schema::create('outcomes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('result', 10)->index();                 // DELIVERED, RTS
            $table->decimal('shipping_loss', 10, 2)->default(0);   // forward + return shipping lost on an RTS
            $table->timestamp('resolved_at')->nullable();
        });
    }

    public function down(): void
    {
        foreach (['outcomes', 'decisions', 'risk_assessments', 'conversations', 'order_items', 'orders', 'customers'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};
