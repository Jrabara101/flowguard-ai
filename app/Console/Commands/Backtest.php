<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Services\Ai\OrderScorer;
use App\Services\BacktestReport;
use App\Services\HistorySignals;
use Illuminate\Console\Command;
use Throwable;

/**
 * "If FlowGuard had held the HIGH orders, how much would we have saved?"
 *
 * Takes past orders whose real outcome (DELIVERED or RTS) is already known, has Gemini score them
 * using only what was known when each order was placed, then compares the advice with what happened.
 * Runs on synthetic data, so the numbers show how the method works, not a real shop's results.
 */
class Backtest extends Command
{
    protected $signature = 'flowguard:backtest
        {--sample=120 : How many past orders to score with Gemini}
        {--concurrency=6 : Parallel Gemini requests}
        {--fresh : Score again even if an order already has an assessment}
        {--json : Print the result as JSON}';

    protected $description = 'Score past orders with Gemini and report what holding HIGH-risk orders would have saved';

    public function handle(OrderScorer $scorer, HistorySignals $signals): int
    {
        $sample = max(10, (int) $this->option('sample'));

        $orders = Order::query()
            ->whereHas('outcome')
            ->when(! $this->option('fresh'), fn ($q) => $q->whereDoesntHave('riskAssessments'))
            ->with(['customer', 'items', 'conversation', 'outcome'])
            ->inRandomOrder()
            ->limit($sample)
            ->get();

        // Reuse earlier assessments so a re-run costs nothing; top up to the requested sample size.
        $already = Order::query()->whereHas('outcome')->whereHas('riskAssessments')->count();
        if (! $this->option('fresh') && $already > 0) {
            $this->line("{$already} past orders already have an assessment; scoring up to {$sample} more.");
        }

        if ($orders->isNotEmpty()) {
            $this->info("Scoring {$orders->count()} past orders with Gemini ({$this->option('concurrency')} at a time)...");
            $inputs = $orders->mapWithKeys(fn (Order $o) => [$o->id => $scorer->inputFromOrder($o, $signals->forOrder($o))])->all();

            $bar = $this->output->createProgressBar(count($inputs));
            $failed = 0;
            foreach (array_chunk($inputs, 24, preserve_keys: true) as $chunk) {
                foreach ($scorer->scoreMany($chunk, (int) $this->option('concurrency')) as $id => $result) {
                    if ($result instanceof Throwable) {
                        $failed++;
                        report($result);
                    } else {
                        $order = $orders->firstWhere('id', $id);
                        $order->riskAssessments()->create([
                            ...$result['assessment'],
                            'model' => $result['model'],
                            'signals' => $signals->forOrder($order) + ['corrections' => $result['notes'], 'backtest' => true],
                        ]);
                    }
                    $bar->advance();
                }
            }
            $bar->finish();
            $this->newLine(2);
            if ($failed) {
                $this->warn("{$failed} orders could not be scored and were skipped.");
            }
        }

        $report = app(BacktestReport::class)->build();
        if ($report === null) {
            $this->error('No scored past orders to report on.');

            return self::FAILURE;
        }

        if ($this->option('json')) {
            $this->line(json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

            return self::SUCCESS;
        }

        $this->render($report);

        return self::SUCCESS;
    }

    private function render(array $r): void
    {
        $h = $r['if_high_orders_were_held'];
        $this->info("Backtest on {$r['scored_orders']} past orders (overall RTS rate {$r['overall_rts_rate']}%)");
        $this->table(['Tier', 'Orders', 'Returned', 'RTS rate'], collect($r['by_tier'])->map(fn ($t, $k) => [$k, $t['orders'], $t['rts'], $t['rts_rate'].'%'])->values()->all());
        $this->line("If FlowGuard had held the HIGH orders:");
        $this->line("  held {$h['orders_held']} orders, {$h['of_which_would_have_returned']} of them really were returned ({$h['precision_pct']}% right)");
        $this->line("  caught {$h['share_of_all_rts_caught_pct']}% of all returns");
        $this->line('  shipping saved: ₱'.number_format($h['shipping_saved_php'], 2).'  (COD value protected: ₱'.number_format($h['cod_value_protected_php'], 2).')');
        $this->line("  {$h['delivered_orders_held_for_confirmation']} good orders would have been asked to confirm first");
        $this->line('  across all '.$r['extrapolated_to_all_orders']['orders_in_book'].' orders: about ₱'.number_format($r['extrapolated_to_all_orders']['shipping_saved_php']).' in shipping');
        $this->line('Models: '.implode(', ', $r['models']));
    }
}
