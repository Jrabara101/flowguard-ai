<?php

namespace App\Services\Ai;

use Google\Auth\ApplicationDefaultCredentials;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Throwable;

/**
 * Thin client for the Vertex AI Gemini generateContent REST API.
 *
 * Auth: on Cloud Run the attached service account is found automatically (Application Default
 * Credentials). On a dev machine we fall back to the `gcloud` login, in local env only.
 */
class VertexClient
{
    private const SCOPE = 'https://www.googleapis.com/auth/cloud-platform';

    /** @param array<string,mixed> $payload a generateContent request body */
    public function generate(string $model, array $payload): array
    {
        $project = config('services.vertex.project');
        $location = config('services.vertex.location', 'global');
        if (! $project) {
            throw new RuntimeException('GOOGLE_CLOUD_PROJECT is not set.');
        }

        $host = $location === 'global' ? 'aiplatform.googleapis.com' : "{$location}-aiplatform.googleapis.com";
        $url = "https://{$host}/v1/projects/{$project}/locations/{$location}/publishers/google/models/{$model}:generateContent";

        try {
            $response = $this->post($url, $payload);
            // A cached token can expire early. Drop it and try once more with a fresh one.
            if ($response->status() === 401) {
                Cache::forget('vertex.access_token');
                $response = $this->post($url, $payload);
            }
        } catch (Throwable $e) {
            throw new RuntimeException('Could not reach Gemini: '.$e->getMessage(), 0, $e);
        }

        if ($response->failed()) {
            $msg = $response->json('error.message') ?? $response->body();
            throw new RuntimeException("Gemini returned HTTP {$response->status()}: ".mb_substr((string) $msg, 0, 300));
        }

        return $response->json();
    }

    /**
     * Run many requests in parallel (used by the backtest).
     *
     * @param  array<int|string, array>  $payloads
     * @return array<int|string, array|Throwable> a response, or the error for that request
     */
    public function generateMany(string $model, array $payloads, int $concurrency = 6): array
    {
        $project = config('services.vertex.project');
        $location = config('services.vertex.location', 'global');
        $host = $location === 'global' ? 'aiplatform.googleapis.com' : "{$location}-aiplatform.googleapis.com";
        $url = "https://{$host}/v1/projects/{$project}/locations/{$location}/publishers/google/models/{$model}:generateContent";
        $token = $this->token();

        $out = [];
        foreach (array_chunk($payloads, $concurrency, preserve_keys: true) as $chunk) {
            $responses = Http::pool(function ($pool) use ($chunk, $url, $token) {
                foreach ($chunk as $key => $payload) {
                    $pool->as((string) $key)->withToken($token)->acceptJson()->timeout(90)->post($url, $payload);
                }
            });
            foreach ($chunk as $key => $_) {
                $r = $responses[(string) $key];
                $out[$key] = $r instanceof Throwable
                    ? $r
                    : ($r->failed() ? new RuntimeException('HTTP '.$r->status().': '.mb_substr((string) ($r->json('error.message') ?? $r->body()), 0, 200)) : $r->json());
            }
        }

        return $out;
    }

    /** Text parts of the first candidate, joined. */
    public static function text(array $response): string
    {
        $parts = $response['candidates'][0]['content']['parts'] ?? [];

        return trim(collect($parts)->reject(fn ($p) => ! empty($p['thought']))->pluck('text')->filter()->implode(''));
    }

    private function post(string $url, array $payload): \Illuminate\Http\Client\Response
    {
        return Http::withToken($this->token())
            ->acceptJson()
            ->timeout(60)
            ->retry(2, 800, fn (Throwable $e) => $this->isTransient($e), throw: false)
            ->post($url, $payload);
    }

    private function isTransient(Throwable $e): bool
    {
        return $e instanceof RequestException
            ? in_array($e->response->status(), [429, 500, 503], true)
            : true;
    }

    private function token(): string
    {
        if ($t = config('services.vertex.access_token')) {
            return $t;
        }

        return Cache::remember('vertex.access_token', now()->addMinutes(15), function () {
            try {
                $creds = ApplicationDefaultCredentials::getCredentials(self::SCOPE);
                $token = $creds->fetchAuthToken()['access_token'] ?? null;
                if ($token) {
                    return $token;
                }
            } catch (Throwable $e) {
                // fall through to the local gcloud fallback
            }

            if (app()->environment('local')) {
                $out = trim((string) shell_exec('gcloud auth print-access-token 2>NUL'));
                if ($out !== '') {
                    return $out;
                }
            }

            throw new RuntimeException('No Google credentials. Run `gcloud auth application-default login`, or deploy with a service account.');
        });
    }
}
