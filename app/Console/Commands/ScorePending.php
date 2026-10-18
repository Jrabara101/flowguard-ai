<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Services\Ai\OrderScorer;
use App\Services\HistorySignals;
use Illuminate\Console\Command;
use Throwable;

/** Fills the Action Queue before a demo: Gemini scores the newest pending orders that have no assessment yet. */
class ScorePending extends Command
{
    protected $signature = 'flowguard:score-pending {--limit=10 : How many pending orders to score} {--concurrency=5 : Parallel Gemini requests}';

    protected $description = 'Score pending orders with Gemini so the Action Queue has something to show';

    public function handle(OrderScorer $scorer, HistorySignals $signals): int
    {
        $orders = Order::query()
            ->where('status', 'PENDING')
            ->whereDoesntHave('riskAssessments')
            ->with(['customer', 'items', 'conversation'])
            ->orderByDesc('placed_at')
            ->limit(max(1, (int) $this->option('limit')))
            ->get();

        if ($orders->isEmpty()) {
            $this->info('No unscored pending orders.');

            return self::SUCCESS;
        }

        $this->info("Scoring {$orders->count()} pending orders with Gemini...");
        $inputs = $orders->mapWithKeys(fn (Order $o) => [$o->id => $scorer->inputFromOrder($o, $signals->forOrder($o))])->all();

        $failed = 0;
        foreach ($scorer->scoreMany($inputs, (int) $this->option('concurrency')) as $id => $result) {
            if ($result instanceof Throwable) {
                $failed++;
                report($result);

                continue;
            }
            $order = $orders->firstWhere('id', $id);
            $order->riskAssessments()->create([
                ...$result['assessment'],
                'model' => $result['model'],
                'signals' => $signals->forOrder($order) + ['corrections' => $result['notes']],
            ]);
            $this->line("  #{$id}: {$result['assessment']['risk_score']} {$result['assessment']['risk_tier']} {$result['assessment']['recommended_action']}");
        }

        $failed ? $this->warn("{$failed} could not be scored.") : $this->info('Done.');

        return $failed ? self::FAILURE : self::SUCCESS;
    }
}
