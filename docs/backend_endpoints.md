# FlowGuard backend: endpoints in use

Base URL locally: `php artisan serve` then `http://127.0.0.1:8000/api`. All JSON.
The two AI routes follow `backend_api_contract.md`. The `orders` routes are extra, added so the screens have data to show.

| Method | Path | What it does |
|---|---|---|
| POST | `/api/ai/score-order` | Contract payload in, assessment out. If `order.id` is a stored order, the result is saved. |
| POST | `/api/ai/copilot` | `{"message": "..."}` in, `{answer, tools_used, data}` out. Gemini Pro picks the tools. |
| GET | `/api/orders` | Action Queue. Filters: `?status=PENDING&tier=HIGH&limit=50`. |
| GET | `/api/orders/{id}` | Detail: order, chat, latest assessment, decision history, outcome. |
| POST | `/api/orders/{id}/score` | Scores a stored order with Gemini Flash (7 to 10 s) and saves it. Show a "scoring" state. |
| POST | `/api/orders/{id}/decision` | Staff decision. Send `{}` to accept the AI advice, or `{"action":"SHIP_NOW","note":"..."}` to override. |

`status` values: `PENDING`, `HOLD`, `CONFIRMING`, `SHIPPED`, `DELIVERED`, `RTS`.
`action` values: `SHIP_NOW`, `CONFIRM_FIRST`, `HOLD`.
The AI routes are limited to 30 requests a minute per IP and return `502 {"message": ...}` if Gemini is unavailable.

## Differences from the contract

- `score-order` also returns `key_moments` (up to 3 exact chat lines behind the score) and `parsed_address.landmark`.
- `risk_tier` and `recommended_action` always agree with `risk_score` (LOW 0-30 SHIP_NOW, MEDIUM 31-65 CONFIRM_FIRST, HIGH 66-100 HOLD). The only exception: a HIGH order whose only problem is a fixable address gap may be `CONFIRM_FIRST`. Some contract examples (for example order 1042 at 78 with CONFIRM_FIRST) do not follow this rule.
- `get_order_details` is a Copilot tool, not an HTTP route. The same data is at `GET /api/orders/{id}`.
- `estimated_savings` in `get_rts_summary` is the shipping cost lost on returned parcels in the range.
- Buyer names are masked (`M. S.`) and phone numbers are only ever a hash.

## Data

`php artisan migrate:fresh --seed` creates a demo login (`admin@flowguard.test`) plus about 2,000 past orders with outcomes and 30 PENDING orders to score. All synthetic, same data every run.

## Backtest

`php artisan flowguard:backtest --sample=150` scores past orders with Gemini and reports what holding the HIGH-risk ones would have saved. Add `--json` for machine-readable output.
