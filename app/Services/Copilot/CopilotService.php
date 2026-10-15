<?php

namespace App\Services\Copilot;

use App\Services\Ai\VertexClient;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

/**
 * Ops Copilot: Gemini Pro decides which read-only tools to call (function calling), we run them,
 * and Gemini writes the answer from the real results.
 */
class CopilotService
{
    private const MAX_STEPS = 5;

    public function __construct(private VertexClient $vertex, private CopilotTools $tools) {}

    /** @return array{answer: string, tools_used: list<string>, data: mixed} */
    public function ask(string $message): array
    {
        $contents = [['role' => 'user', 'parts' => [['text' => $message]]]];
        $used = [];
        $results = [];

        for ($step = 0; $step < self::MAX_STEPS; $step++) {
            $response = $this->generate([
                'systemInstruction' => ['parts' => [['text' => $this->systemPrompt()]]],
                'contents' => $contents,
                'tools' => CopilotTools::declarations(),
                'generationConfig' => ['maxOutputTokens' => 4096],
            ]);

            $content = $response['candidates'][0]['content'] ?? null;
            $parts = $content['parts'] ?? [];
            $calls = array_values(array_filter($parts, fn ($p) => isset($p['functionCall'])));

            if ($calls === []) {
                $answer = VertexClient::text($response);
                if ($answer === '') {
                    throw new RuntimeException('Gemini returned an empty answer.');
                }

                return [
                    'answer' => $answer,
                    'tools_used' => array_values(array_unique($used)),
                    // One tool: its result. Several: results keyed by tool name.
                    'data' => count($results) === 1 ? reset($results) : (object) $results,
                ];
            }

            // Send the model's turn back exactly as received (Gemini 3 needs its thought signatures), then the results.
            $contents[] = ['role' => 'model', 'parts' => $parts];
            $replies = [];
            foreach ($calls as $part) {
                $name = $part['functionCall']['name'];
                $args = $part['functionCall']['args'] ?? [];
                $used[] = $name;
                try {
                    $result = $this->tools->call($name, is_array($args) ? $args : []);
                    $results[$name] = $result;
                } catch (InvalidArgumentException $e) {
                    $result = ['error' => $e->getMessage()];
                }
                $replies[] = ['functionResponse' => ['name' => $name, 'response' => ['result' => $result]]];
            }
            $contents[] = ['role' => 'user', 'parts' => $replies];
        }

        throw new RuntimeException('The Copilot took too many steps to answer.');
    }

    /** Try the Pro model, then the fallback if Pro is unavailable. */
    private function generate(array $payload): array
    {
        $primary = config('services.vertex.pro_model');
        $fallback = config('services.vertex.pro_fallback_model');

        try {
            return $this->vertex->generate($primary, $payload);
        } catch (Throwable $e) {
            if (! $fallback || $fallback === $primary) {
                throw $e;
            }
            report($e);

            return $this->vertex->generate($fallback, $payload);
        }
    }

    private function systemPrompt(): string
    {
        $today = now()->timezone('Asia/Manila')->format('l, F j, Y');

        return str_replace('{{today}}', $today, file_get_contents(resource_path('ai/copilot_system_prompt.md')));
    }
}
