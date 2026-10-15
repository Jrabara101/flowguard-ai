<!-- Source: Google Doc "AI part of FlowGuard AI" https://docs.google.com/document/d/1eHovxm1ExFBC_mto8Ij4VeEAAiT-vAS3qA7Om-oyPHY (revision AHj4eMQYE53i...) -->

# AI part of FlowGuard AI: backend API contract

| **API Name** | **Input** | **Output** |
|---|---|---|
| `POST /api/ai/score-order` | Order details, customer history, address, conversation, history signals | `risk_score`, `risk_tier`, `reasons`, `buyer_intent`, `parsed_address`, `recommended_action`, `confirmation_message`, `confidence` |
| `POST /api/ai/copilot` | `message` | `answer`, `tools_used`, `data` |
| `get_rts_summary` | `date_range` | Total orders, RTS orders, RTS rate, estimated savings |
| `get_orders_by_risk` | `tier`, `date_range` | Orders matching the risk tier |
| `get_product_rts_rate` | `date_range` | RTS rate per product |
| `get_region_trends` | `date_range` | RTS/risk trends by province/city |
| `get_order_details` | `order_id` | Order details, risk assessment, decision history |

Below is the detailed API contract for the **AI part of FlowGuard AI**, based on the project specification.

#### 1. `POST /api/ai/score-order`

**Purpose:** Main Gemini Flash API. Scores an incoming COD order and produces the complete AI assessment in **one call**.

**Input**

```json
{
  "order": {
    "id": 1042,
    "channel": "META_SHOP",
    "amount": 1499,
    "payment_type": "COD",
    "items": [
      {
        "name": "Wireless Earbuds",
        "quantity": 1,
        "price": 1499
      }
    ],
    "address": "Blk 5 Lot 8, Brgy. San Isidro, Quezon City",
    "customer": {
      "phone_hash": "sha256:abc123",
      "total_orders": 3,
      "delivered_count": 2,
      "rts_count": 1
    },
    "conversation": [
      {
        "sender": "BUYER",
        "message": "Magkano po?"
      },
      {
        "sender": "SELLER",
        "message": "1499 po COD."
      },
      {
        "sender": "BUYER",
        "message": "Pwede next week na lang delivery?"
      }
    ]
  },
  "history_signals": {
    "past_rts_count": 1,
    "order_value_vs_customer_average": 1.4,
    "is_repeat_phone": true,
    "is_cod": true
  }
}
```

**Output**

```json
{
  "risk_score": 78,
  "risk_tier": "HIGH",
  "reasons": [
    "Customer has a previous RTS order",
    "Buyer requested delayed delivery after placing the order",
    "Order is COD",
    "Address is missing a landmark"
  ],
  "buyer_intent": "HESITANT",
  "parsed_address": {
    "house": "Blk 5 Lot 8",
    "street": null,
    "barangay": "San Isidro",
    "city": "Quezon City",
    "province": "Metro Manila",
    "zip": null,
    "missing_fields": [
      "landmark"
    ]
  },
  "recommended_action": "CONFIRM_FIRST",
  "confirmation_message": "Hi po! 😊 Please confirm po if okay ang delivery of your Wireless Earbuds worth ₱1,499 COD. May we also have a nearby landmark for the delivery address? Thank you!",
  "confidence": "HIGH"
}
```

#### 2. `POST /api/ai/copilot`

**Purpose:** Ops Copilot API using Gemini Pro/function calling. It answers operational questions by calling the appropriate read-only tool.

**Input**

```json
{
  "message": "Which provinces had the highest RTS rate this week?"
}
```

**Another input**

```json
{
  "message": "Why is order #1042 on hold?"
}
```

**Output**

```json
{
  "answer": "Cavite had the highest RTS rate this week at 15.0%, with 48 RTS orders out of 320 orders.",
  "tools_used": [
    "get_region_trends"
  ],
  "data": {
    "province": "Cavite",
    "rts_rate": 15.0,
    "rts_orders": 48,
    "total_orders": 320
  }
}
```

#### 3. `get_rts_summary`

**Purpose:** Gives the Copilot overall RTS performance for a date range.

**Input**

```json
{
  "date_range": {
    "from": "2026-10-01",
    "to": "2026-10-07"
  }
}
```

**Output**

```json
{
  "total_orders": 1250,
  "rts_orders": 137,
  "rts_rate": 10.96,
  "estimated_savings": 68500
}
```

#### 4. `get_orders_by_risk`

**Purpose:** Retrieves orders belonging to a specific AI risk tier.

**Input**

```json
{
  "tier": "HIGH",
  "date_range": {
    "from": "2026-10-01",
    "to": "2026-10-07"
  }
}
```

**Output**

```json
{
  "tier": "HIGH",
  "count": 24,
  "orders": [
    {
      "order_id": 1042,
      "risk_score": 87,
      "risk_tier": "HIGH",
      "recommended_action": "HOLD",
      "amount": 1499
    },
    {
      "order_id": 1057,
      "risk_score": 81,
      "risk_tier": "HIGH",
      "recommended_action": "CONFIRM_FIRST",
      "amount": 899
    }
  ]
}
```

#### 5. `get_product_rts_rate`

**Purpose:** Shows RTS performance broken down by product.

**Input**

```json
{
  "date_range": {
    "from": "2026-10-01",
    "to": "2026-10-07"
  }
}
```

**Output**

```json
{
  "products": [
    {
      "product_id": "P101",
      "product_name": "Wireless Earbuds",
      "total_orders": 320,
      "rts_orders": 48,
      "rts_rate": 15.0
    },
    {
      "product_id": "P205",
      "product_name": "Phone Case",
      "total_orders": 450,
      "rts_orders": 27,
      "rts_rate": 6.0
    }
  ]
}
```

#### 6. `get_region_trends`

**Purpose:** Gives regional risk/RTS trends, while framing location as courier/route performance rather than customer traits.

**Input**

```json
{
  "date_range": {
    "from": "2026-10-01",
    "to": "2026-10-07"
  }
}
```

**Output**

```json
{
  "regions": [
    {
      "province": "Cavite",
      "city": "Bacoor",
      "total_orders": 320,
      "rts_orders": 48,
      "rts_rate": 15.0,
      "average_risk_score": 71
    },
    {
      "province": "Laguna",
      "city": "Santa Rosa",
      "total_orders": 280,
      "rts_orders": 22,
      "rts_rate": 7.86,
      "average_risk_score": 54
    }
  ]
}
```

#### 7. `get_order_details`

**Purpose:** Gives Copilot the complete information for one order, including its AI assessment and decision history.

**Input**

```json
{
  "order_id": 1042
}
```

**Output**

```json
{
  "order": {
    "id": 1042,
    "channel": "META_SHOP",
    "amount": 1499,
    "payment_type": "COD",
    "status": "HOLD"
  },
  "risk_assessment": {
    "risk_score": 78,
    "risk_tier": "HIGH",
    "buyer_intent": "HESITANT",
    "reasons": [
      "Previous RTS order",
      "Buyer requested delayed delivery",
      "Address missing landmark"
    ],
    "recommended_action": "CONFIRM_FIRST",
    "confidence": "HIGH"
  },
  "decision_history": [
    {
      "action": "HOLD",
      "actor": "STAFF",
      "timestamp": "2026-10-07T10:30:00Z"
    }
  ]
}
```

#### AI responsibilities

| **API** | **AI/Backend responsibility** |
|---|---|
| `score-order` | **Gemini Flash reasoning** — risk, intent, address parsing, action recommendation, message |
| `copilot` | **Gemini Pro reasoning + function calling** |
| `get_rts_summary` | Backend/database data |
| `get_orders_by_risk` | Backend/database data |
| `get_product_rts_rate` | Backend/database data |
| `get_region_trends` | Backend/database data |
| `get_order_details` | Backend/database data |
