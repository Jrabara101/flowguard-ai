<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Synthetic data only: no real people, phone numbers or addresses.
 *
 * ~2,000 past orders with DELIVERED/RTS outcomes, then ~30 new PENDING orders to score.
 * Outcomes are drawn from a risk model (prior RTS, hesitant chat, incomplete address, order size,
 * courier performance on the route), so signals and results are correlated the way real data would be.
 * The random seed is fixed, so every run produces the same data.
 */
class FlowGuardSeeder extends Seeder
{
    private const PAST_ORDERS = 2000;
    private const PENDING_ORDERS = 30;

    private const FIRST = ['Maria', 'Jose', 'Ana', 'Juan', 'Grace', 'Mark', 'Joy', 'Paolo', 'Angel', 'Kyle', 'Rica', 'Carlo', 'Jasmine', 'Rey', 'Liza', 'Dennis', 'Bea', 'Nico', 'Aira', 'Miguel', 'Cheska', 'Ronnie', 'Trisha', 'Allan', 'Mae', 'Jerome', 'Kim', 'Arnel', 'Nina', 'Ryan'];
    private const LAST = ['Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Mendoza', 'Torres', 'Villanueva', 'Ramos', 'Aquino', 'Castillo', 'Flores', 'Dela Cruz', 'Navarro', 'Salazar', 'Pascual', 'Domingo', 'Lopez', 'Rivera', 'Gonzales', 'Fernandez', 'Marquez', 'Soriano', 'Valdez'];

    /** id, name, price, extra RTS risk */
    private const PRODUCTS = [
        ['P101', 'Wireless Earbuds', 1499, 0.06],
        ['P205', 'Phone Case', 299, -0.03],
        ['P310', 'Skincare Set', 899, 0.01],
        ['P118', 'Power Bank', 1199, 0.02],
        ['P222', 'LED Ring Light', 799, 0.03],
        ['P330', 'Sling Bag', 649, 0.0],
        ['P415', 'Running Sneakers', 1899, 0.05],
        ['P120', 'Smart Watch', 1799, 0.07],
        ['P260', 'Soap Bundle', 399, -0.02],
        ['P275', 'Kitchen Organizer', 549, -0.01],
    ];

    /** city, province, extra RTS risk (courier performance on that route) */
    private const AREAS = [
        ['Quezon City', 'Metro Manila', -0.01], ['Manila', 'Metro Manila', 0.0], ['Caloocan', 'Metro Manila', 0.02],
        ['Bacoor', 'Cavite', 0.07], ['Dasmariñas', 'Cavite', 0.05],
        ['Santa Rosa', 'Laguna', -0.02], ['San Pedro', 'Laguna', -0.02], ['Calamba', 'Laguna', 0.0],
        ['Antipolo', 'Rizal', 0.03], ['Cebu City', 'Cebu', 0.02], ['Davao City', 'Davao del Sur', 0.01],
        ['Angeles', 'Pampanga', 0.0], ['Iloilo City', 'Iloilo', 0.02], ['Cagayan de Oro', 'Misamis Oriental', 0.04],
    ];

    private const BARANGAYS = ['San Isidro', 'Poblacion', 'San Antonio', 'Santa Cruz', 'Bagong Silang', 'Mabuhay', 'Santo Niño', 'Maligaya', 'Pag-asa', 'San Jose', 'Bagumbayan', 'Commonwealth'];

    private const LANDMARKS = ['near the Mercury Drug', 'beside the barangay hall', 'in front of 7-Eleven', 'near the basketball court', 'behind the chapel'];

    private array $customers = [];   // id => [name, hash, rtsProne, orders, rts, spent]
    private array $orderRows = [];
    private array $itemRows = [];
    private array $chatRows = [];
    private array $outcomeRows = [];
    private int $orderId = 0;

    public function run(): void
    {
        mt_srand(2026);

        DB::transaction(function () {
            foreach (['outcomes', 'decisions', 'risk_assessments', 'conversations', 'order_items', 'orders', 'customers'] as $t) {
                DB::table($t)->delete();
            }

            $this->makeCustomers(900);

            // Past orders, oldest first, so a customer's history builds up in order.
            $start = now()->subDays(90)->timestamp;
            $end = now()->subDays(3)->timestamp;
            $times = [];
            for ($i = 0; $i < self::PAST_ORDERS; $i++) {
                $times[] = mt_rand($start, $end);
            }
            sort($times);
            foreach ($times as $t) {
                $this->makeOrder($t, pending: false);
            }

            // New orders waiting for a decision, in the last 36 hours.
            for ($i = 0; $i < self::PENDING_ORDERS; $i++) {
                $this->makeOrder(now()->subMinutes(mt_rand(10, 36 * 60))->timestamp, pending: true);
            }

            $this->flush();
        });

        $this->command?->info('Seeded '.self::PAST_ORDERS.' past and '.self::PENDING_ORDERS.' pending orders.');
    }

    private function makeCustomers(int $n): void
    {
        $now = now();
        $rows = [];
        for ($id = 1; $id <= $n; $id++) {
            $name = self::FIRST[array_rand(self::FIRST)].' '.self::LAST[array_rand(self::LAST)];
            $hash = hash('sha256', "synthetic-phone-{$id}");
            $rows[] = ['id' => $id, 'name' => $name, 'phone_hash' => $hash, 'created_at' => $now, 'updated_at' => $now];
            $this->customers[$id] = ['rtsProne' => mt_rand(1, 100) <= 10, 'orders' => 0, 'rts' => 0, 'spent' => 0.0];
        }
        foreach (array_chunk($rows, 300) as $c) {
            DB::table('customers')->insert($c);
        }
    }

    private function makeOrder(int $ts, bool $pending): void
    {
        $id = ++$this->orderId;

        // About 40% of orders come from returning buyers.
        $returning = array_keys(array_filter($this->customers, fn ($c) => $c['orders'] > 0));
        $cid = ($returning && mt_rand(1, 100) <= 40) ? $returning[array_rand($returning)] : mt_rand(1, count($this->customers));
        $cust = &$this->customers[$cid];

        [$city, $province, $areaRisk] = self::AREAS[array_rand(self::AREAS)];
        [$pid, $pname, $price, $prodRisk] = self::PRODUCTS[array_rand(self::PRODUCTS)];
        $qty = mt_rand(1, 100) <= 85 ? 1 : mt_rand(2, 3);
        // Some orders are an unusually large basket for the buyer.
        $big = mt_rand(1, 100) <= 8;
        $amount = $price * $qty * ($big ? 2 : 1);
        $payment = mt_rand(1, 100) <= 78 ? 'COD' : 'PREPAID';
        $channel = ['META_SHOP', 'META_SHOP', 'MESSENGER', 'TIKTOK_SHOP'][mt_rand(0, 3)];

        // Address quality: complete, missing barangay, or vague.
        $roll = mt_rand(1, 100);
        $addrQuality = $roll <= 72 ? 'complete' : ($roll <= 90 ? 'no_barangay' : 'vague');
        $house = 'Blk '.mt_rand(1, 30).' Lot '.mt_rand(1, 20);
        $brgy = self::BARANGAYS[array_rand(self::BARANGAYS)];
        $address = match ($addrQuality) {
            'complete' => "{$house}, Brgy. {$brgy}, {$city}".(mt_rand(1, 100) <= 50 ? ', '.self::LANDMARKS[array_rand(self::LANDMARKS)] : ''),
            'no_barangay' => "{$house}, {$city}",
            'vague' => 'Near the church, '.$province,
        };

        // What the buyer is like in chat.
        $roll = mt_rand(1, 100);
        $trait = match (true) {
            $roll <= 15 => 'none',
            $roll <= 55 => 'committed',
            $roll <= 70 => 'hesitant',
            $roll <= 82 => 'price',
            $roll <= 90 => 'address_change',
            default => 'prank',
        };

        // Risk model that decides the outcome of past orders.
        $p = 0.015 + $prodRisk + $areaRisk;
        $p += $payment === 'COD' ? 0.03 : -0.03;
        $p += min(0.4, $cust['rts'] * 0.15) + ($cust['rtsProne'] ? 0.12 : 0);
        $p += ['none' => 0.02, 'committed' => -0.03, 'hesitant' => 0.2, 'price' => 0.05, 'address_change' => 0.12, 'prank' => 0.3][$trait];
        $p += ['complete' => 0.0, 'no_barangay' => 0.08, 'vague' => 0.14][$addrQuality];
        $p += $big ? 0.08 : 0.0;
        if ($cust['orders'] > 0 && $cust['rts'] === 0) {
            $p -= 0.03;   // a repeat buyer with clean history
        }
        $p = max(0.02, min(0.9, $p));

        $this->orderRows[] = [
            'id' => $id, 'customer_id' => $cid, 'channel' => $channel, 'amount' => $amount, 'payment_type' => $payment,
            'address' => $address, 'province' => $province, 'city' => $city,
            'status' => 'PENDING', 'placed_at' => date('Y-m-d H:i:s', $ts),
            'created_at' => date('Y-m-d H:i:s', $ts), 'updated_at' => date('Y-m-d H:i:s', $ts),
        ];
        $this->itemRows[] = ['order_id' => $id, 'product_id' => $pid, 'product_name' => $pname, 'quantity' => $qty * ($big ? 2 : 1), 'price' => $price];

        foreach ($this->chat($trait, $pname, $amount, $address, $ts) as $line) {
            $this->chatRows[] = ['order_id' => $id] + $line;
        }

        if (! $pending) {
            $rts = (mt_rand(0, 9999) / 10000) < $p;
            $resolved = min($ts + mt_rand(3, 9) * 86400, now()->timestamp);
            $this->outcomeRows[] = [
                'order_id' => $id, 'result' => $rts ? 'RTS' : 'DELIVERED',
                'shipping_loss' => $rts ? mt_rand(180, 300) : 0, 'resolved_at' => date('Y-m-d H:i:s', $resolved),
            ];
            $this->orderRows[count($this->orderRows) - 1]['status'] = $rts ? 'RTS' : 'DELIVERED';
            $cust['rts'] += $rts ? 1 : 0;
        }
        $cust['orders']++;
        unset($cust);

        if (count($this->orderRows) >= 400) {
            $this->flush();
        }
    }

    /** @return list<array{sender:string,message:string,sent_at:string}> */
    private function chat(string $trait, string $product, float|int $amount, string $address, int $ts): array
    {
        $a = number_format($amount);
        $english = mt_rand(1, 100) <= 25;
        $lines = match ($trait) {
            'none' => [],
            'committed' => $english ? [
                ['BUYER', "Hello, is the {$product} still available?"],
                ['SELLER', "Yes po! ₱{$a} COD."],
                ['BUYER', "Great, I'll take it. Please ship to {$address}. I'm home all week."],
                ['SELLER', 'Noted po! We will ship it today.'],
            ] : [
                ['BUYER', "Hi po, available pa po ba yung {$product}?"],
                ['SELLER', "Hello po! Yes po available. ₱{$a} COD po."],
                ['BUYER', "Sige po kukunin ko. Address ko po: {$address}"],
                ['SELLER', 'Noted po! Ipapadala na po namin ngayon.'],
                ['BUYER', 'Thank you po! Asahan ko po bukas.'],
            ],
            'hesitant' => [
                ['BUYER', "Magkano po yung {$product}?"],
                ['SELLER', "₱{$a} po, COD."],
                ['BUYER', 'Pwede po ba next week na lang i-deliver? Wala pa po kasi sahod.'],
                ['SELLER', 'Sige po, i-confirm po namin ulit.'],
                ['BUYER', 'Baka po next month pa ako makabayad hehe'],
            ],
            'price' => [
                ['BUYER', "Pwede po bang mas mura yung {$product}? ₱".number_format($amount * 0.7).' lang po?'],
                ['SELLER', "₱{$a} po fixed price na po."],
                ['BUYER', 'Sa ibang shop mas mura po eh'],
                ['SELLER', 'Okay po, itutuloy na po ba natin?'],
                ['BUYER', 'Pag-iisipan ko po muna'],
            ],
            'address_change' => [
                ['BUYER', "Hi po, order ko yung {$product}."],
                ['SELLER', "Yes po! Ipapadala po namin sa {$address}, ₱{$a} COD."],
                ['BUYER', 'Ay wait po, palitan ko po address, sa probinsya na po pala.'],
                ['SELLER', 'Ano pong bagong address?'],
                ['BUYER', 'Ipapadala ko na lang po mamaya'],
            ],
            'prank' => [
                ['BUYER', 'test'],
                ['SELLER', 'Hello po! Ano pong order ninyo?'],
                ['BUYER', 'hahaha pa-order lang po 😂'],
                ['SELLER', 'Ano pong address ninyo?'],
                ['BUYER', 'wala lang trip ko lang'],
            ],
        };

        $out = [];
        foreach ($lines as $i => [$sender, $message]) {
            $out[] = ['sender' => $sender, 'message' => $message, 'sent_at' => date('Y-m-d H:i:s', $ts - (count($lines) - $i) * 90)];
        }

        return $out;
    }

    private function flush(): void
    {
        // Parents first, so foreign keys are always satisfied.
        $this->insertChunks('orders', $this->orderRows);
        $this->insertChunks('order_items', $this->itemRows);
        $this->insertChunks('conversations', $this->chatRows);
        $this->insertChunks('outcomes', $this->outcomeRows);
        $this->orderRows = $this->itemRows = $this->chatRows = $this->outcomeRows = [];
    }

    private function insertChunks(string $table, array $rows): void
    {
        foreach (array_chunk($rows, 200) as $chunk) {
            DB::table($table)->insert($chunk);
        }
    }
}
