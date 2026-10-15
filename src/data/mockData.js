/**
 * FlowGuard AI Mock Store
 * Grounded in docs/backend_api_contract.md and prompts/sample_orders.md
 * Simulated data for Philippine COD social-commerce fulfillment
 */

export const INITIAL_ORDERS = [
  {
    id: 1043,
    channel: "Facebook Live",
    amount: 1849,
    payment_type: "COD",
    created_at: "2026-10-15T09:42:00Z",
    items: [
      { name: "Bluetooth Speaker XB-20", quantity: 1, price: 1250 },
      { name: "LED Ring Light 10in", quantity: 1, price: 599 }
    ],
    raw_address: "Purok 3, Brgy. San Isidro, Cabuyao, Laguna",
    customer: {
      name: "Rochelle M.",
      phone_masked: "09•• ••• 7731",
      phone_hash: "sha256:77319a",
      total_orders: 3,
      delivered_count: 1,
      rts_count: 2
    },
    signals: {
      customer_total_orders: 3,
      customer_delivered: 1,
      customer_rts: 2,
      past_rts_count: 2,
      order_value_vs_customer_avg: 2.4,
      is_repeat_phone: true,
      phone_seen_on_other_accounts: 1,
      courier_success_rate_destination: 0.88,
      is_cod: true
    },
    conversation: [
      { sender: "BUYER", message: "mine po speaker at ring light" },
      { sender: "SELLER", message: "Noted po! ₱1,849 COD. Ship na po namin bukas?" },
      { sender: "BUYER", message: "pwede bang next week na lang? wala pa kasi sahod hehe" },
      { sender: "BUYER", message: "or kahit i-ship nyo na basta pag dumating baka wala ako" }
    ],
    risk_assessment: {
      risk_score: 87,
      risk_tier: "HIGH",
      buyer_intent: "HESITANT",
      confidence: "HIGH",
      recommended_action: "HOLD",
      reasons: [
        "Customer has 2 previous return-to-sender (RTS) orders",
        "Buyer asked to postpone delivery until payday ('wala pa sahod')",
        "Buyer warned they may not be available when courier arrives",
        "Order amount (₱1,849) is 2.4x the customer's historical average"
      ],
      key_moments: [
        "pwede bang next week na lang? wala pa kasi sahod hehe",
        "or kahit i-ship nyo na basta pag dumating baka wala ako"
      ],
      parsed_address: {
        house: "Purok 3",
        street: "",
        barangay: "San Isidro",
        city: "Cabuyao",
        province: "Laguna",
        zip: "4025",
        landmark: "",
        missing_fields: ["landmark"]
      },
      confirmation_message: "Magandang araw po! 😊 Pwede po bang ma-confirm kung kailan po ang pinaka-okay na date para mai-deliver ang inyong Bluetooth Speaker at Ring Light (₱1,849 COD)? May landmark din po ba kayo malapit sa Purok 3? Salamat po!"
    },
    decision: {
      status: "PENDING", // PENDING, ACCEPTED, OVERRIDDEN
      action: null,
      actor: null,
      note: null,
      timestamp: null
    },
    decision_history: []
  },
  {
    id: 1042,
    channel: "Meta Shops",
    amount: 1899,
    payment_type: "COD",
    created_at: "2026-10-15T09:15:00Z",
    items: [
      { name: "Air Fryer 5L Touch Control", quantity: 1, price: 1899 }
    ],
    raw_address: "123 Rizal St., Calamba City",
    customer: {
      name: "Angelo D.",
      phone_masked: "09•• ••• 2290",
      phone_hash: "sha256:2290bc",
      total_orders: 0,
      delivered_count: 0,
      rts_count: 0
    },
    signals: {
      customer_total_orders: 0,
      customer_delivered: 0,
      customer_rts: 0,
      past_rts_count: 0,
      order_value_vs_customer_avg: null,
      is_repeat_phone: false,
      phone_seen_on_other_accounts: 0,
      courier_success_rate_destination: 0.91,
      is_cod: true
    },
    conversation: [
      { sender: "BUYER", message: "hm po air fryer" },
      { sender: "SELLER", message: "₱1,899 po with free shipping" },
      { sender: "BUYER", message: "wala na po less? sa iba 1.7k lang" },
      { sender: "SELLER", message: "Sorry po, fixed price na po. Original po ito with 1 year warranty" },
      { sender: "BUYER", message: "sige order nalang ako. magkano ulit total?" }
    ],
    risk_assessment: {
      risk_score: 58,
      risk_tier: "MEDIUM",
      buyer_intent: "PRICE_SHOPPING",
      confidence: "HIGH",
      recommended_action: "CONFIRM_FIRST",
      reasons: [
        "First-time buyer with no prior delivery track record",
        "Delivery address is missing both barangay and landmark",
        "Buyer exhibited price hesitation and price comparison in chat"
      ],
      key_moments: [
        "wala na po less? sa iba 1.7k lang",
        "sige order nalang ako. magkano ulit total?"
      ],
      parsed_address: {
        house: "123",
        street: "Rizal St.",
        barangay: "",
        city: "Calamba City",
        province: "Laguna",
        zip: "4027",
        landmark: "",
        missing_fields: ["barangay", "landmark"]
      },
      confirmation_message: "Hi po! Salamat po sa order ninyong Air Fryer 5L (₱1,899 COD). Para mai-book po sa courier, pwede po bang mahingi ang inyong Barangay at pinakamalapit na landmark sa Rizal St.? Maraming salamat po!"
    },
    decision: {
      status: "PENDING",
      action: null,
      actor: null,
      note: null,
      timestamp: null
    },
    decision_history: []
  },
  {
    id: 1044,
    channel: "TikTok Shop",
    amount: 2697,
    payment_type: "COD",
    created_at: "2026-10-15T08:50:00Z",
    items: [
      { name: "Wireless Earbuds Pro (3-pack bundle)", quantity: 3, price: 899 }
    ],
    raw_address: "Unit 4B, 88 Katipunan Ave., Brgy. Loyola Heights, Quezon City, Metro Manila 1108",
    customer: {
      name: "Kristine G.",
      phone_masked: "09•• ••• 5502",
      phone_hash: "sha256:5502dd",
      total_orders: 0,
      delivered_count: 0,
      rts_count: 0
    },
    signals: {
      customer_total_orders: 0,
      customer_delivered: 0,
      customer_rts: 0,
      past_rts_count: 0,
      order_value_vs_customer_avg: null,
      is_repeat_phone: true,
      phone_seen_on_other_accounts: 3,
      courier_success_rate_destination: 0.95,
      is_cod: true
    },
    conversation: [
      { sender: "BUYER", message: "hi i placed an order for 3 earbuds" },
      { sender: "BUYER", message: "can you change the address to my cousin in Cebu instead? I'll send it later" },
      { sender: "SELLER", message: "Sure po, please send the complete address" }
    ],
    risk_assessment: {
      risk_score: 64,
      risk_tier: "MEDIUM",
      buyer_intent: "UNVERIFIED",
      confidence: "LOW",
      recommended_action: "CONFIRM_FIRST",
      reasons: [
        "Buyer requested address change across islands (NCR to Cebu) post-checkout",
        "Phone number detected across 3 distinct marketplace buyer profiles",
        "Target recipient name and full address pending confirmation"
      ],
      key_moments: [
        "can you change the address to my cousin in Cebu instead? I'll send it later"
      ],
      parsed_address: {
        house: "Unit 4B",
        street: "88 Katipunan Ave.",
        barangay: "Loyola Heights",
        city: "Quezon City",
        province: "Metro Manila",
        zip: "1108",
        landmark: "",
        missing_fields: ["verified_cebu_address", "recipient_contact"]
      },
      confirmation_message: "Hello po! We noted your request to redirect the 3x Wireless Earbuds (₱2,697 COD) to Cebu. Kindly reply with your cousin's full name, complete Cebu delivery address, and active contact number so we can process. Thank you!"
    },
    decision: {
      status: "PENDING",
      action: null,
      actor: null,
      note: null,
      timestamp: null
    },
    decision_history: []
  },
  {
    id: 1045,
    channel: "Pancake POS",
    amount: 799,
    payment_type: "COD",
    created_at: "2026-10-15T08:20:00Z",
    items: [
      { name: "Kids Ergonomic School Bag Set", quantity: 1, price: 799 }
    ],
    raw_address: "malapit sa simbahan, San Pedro Laguna",
    customer: {
      name: "Marites S.",
      phone_masked: "09•• ••• 3368",
      phone_hash: "sha256:3368fe",
      total_orders: 1,
      delivered_count: 1,
      rts_count: 0
    },
    signals: {
      customer_total_orders: 1,
      customer_delivered: 1,
      customer_rts: 0,
      past_rts_count: 0,
      order_value_vs_customer_avg: 0.9,
      is_repeat_phone: false,
      phone_seen_on_other_accounts: 0,
      courier_success_rate_destination: 0.93,
      is_cod: true
    },
    conversation: [
      { sender: "BUYER", message: "Magandang araw po. Kukunin ko na po yung bag set para sa anak ko" },
      { sender: "SELLER", message: "Salamat po! ₱799 COD po. Pakisend po ang address" },
      { sender: "BUYER", message: "malapit sa simbahan po San Pedro Laguna. Kailan po darating?" }
    ],
    risk_assessment: {
      risk_score: 48,
      risk_tier: "MEDIUM",
      buyer_intent: "COMMITTED",
      confidence: "HIGH",
      recommended_action: "CONFIRM_FIRST",
      reasons: [
        "Buyer demonstrates clear purchase commitment for their child",
        "Address is overly vague and missing house number, street, and barangay",
        "High courier success rate in San Pedro (93%) once specific location is known"
      ],
      key_moments: [
        "Magandang araw po. Kukunin ko na po yung bag set para sa anak ko",
        "malapit sa simbahan po San Pedro Laguna. Kailan po darating?"
      ],
      parsed_address: {
        house: "",
        street: "",
        barangay: "",
        city: "San Pedro",
        province: "Laguna",
        zip: "4023",
        landmark: "malapit sa simbahan",
        missing_fields: ["house", "street", "barangay"]
      },
      confirmation_message: "Magandang araw po ma'am/sir! 😊 Ihanda na po namin ang Kids School Bag (₱799 COD). Pwede po bang makahingi ng House/Lot number, Street, at Barangay ninyo sa San Pedro para hindi po maligaw si kuya rider? Salamat po!"
    },
    decision: {
      status: "PENDING",
      action: null,
      actor: null,
      note: null,
      timestamp: null
    },
    decision_history: []
  },
  {
    id: 1046,
    channel: "Meta Shops",
    amount: 3499,
    payment_type: "COD",
    created_at: "2026-10-15T07:45:00Z",
    items: [
      { name: "Ultra AMOLED Smart Watch with Calling", quantity: 1, price: 3499 }
    ],
    raw_address: "Brgy. San Jose, Antipolo City, Rizal",
    customer: {
      name: "Jerome P.",
      phone_masked: "09•• ••• 9182",
      phone_hash: "sha256:9182aa",
      total_orders: 2,
      delivered_count: 1,
      rts_count: 1
    },
    signals: {
      customer_total_orders: 2,
      customer_delivered: 1,
      customer_rts: 1,
      past_rts_count: 1,
      order_value_vs_customer_avg: 2.8,
      is_repeat_phone: true,
      phone_seen_on_other_accounts: 1,
      courier_success_rate_destination: 0.84,
      is_cod: true
    },
    conversation: [
      { sender: "BUYER", message: "avail pa smartwatch?" },
      { sender: "SELLER", message: "Yes po! ₱3,499 with free magnetic charger" },
      { sender: "BUYER", message: "order ako. san jose antipolo" },
      { sender: "SELLER", message: "Address po complete?" },
      { sender: "BUYER", message: "pag andyan na si rider tawag na lang sya" }
    ],
    risk_assessment: {
      risk_score: 79,
      risk_tier: "HIGH",
      buyer_intent: "UNVERIFIED",
      confidence: "HIGH",
      recommended_action: "HOLD",
      reasons: [
        "Customer has 1 prior RTS order and high COD value (₱3,499)",
        "Buyer refused to provide complete address ('tawag na lang si rider')",
        "Missing house number, street name, and identifiable delivery landmark"
      ],
      key_moments: [
        "order ako. san jose antipolo",
        "pag andyan na si rider tawag na lang sya"
      ],
      parsed_address: {
        house: "",
        street: "",
        barangay: "San Jose",
        city: "Antipolo City",
        province: "Rizal",
        zip: "1870",
        landmark: "",
        missing_fields: ["house", "street", "landmark"]
      },
      confirmation_message: "Good day po! Para ma-dispatch po ang Smart Watch (₱3,499 COD), kailangan po ng aming courier ng complete house number at street name sa San Jose. Hindi po kasi pinapayagan ng hub ang dispatch kapag barangay lang po. Salamat po!"
    },
    decision: {
      status: "PENDING",
      action: null,
      actor: null,
      note: null,
      timestamp: null
    },
    decision_history: []
  },
  {
    id: 1041,
    channel: "Pancake POS",
    amount: 698,
    payment_type: "COD",
    created_at: "2026-10-15T07:10:00Z",
    items: [
      { name: "Collagen Glow Serum 30ml", quantity: 2, price: 349 }
    ],
    raw_address: "Blk 12 Lot 5 Phase 2, Mabuhay Homes, Brgy. Pooc, Santa Rosa, Laguna 4026, near the basketball court",
    customer: {
      name: "Carla V.",
      phone_masked: "09•• ••• 4417",
      phone_hash: "sha256:4417ee",
      total_orders: 6,
      delivered_count: 6,
      rts_count: 0
    },
    signals: {
      customer_total_orders: 6,
      customer_delivered: 6,
      customer_rts: 0,
      past_rts_count: 0,
      order_value_vs_customer_avg: 1.1,
      is_repeat_phone: false,
      phone_seen_on_other_accounts: 0,
      courier_success_rate_destination: 0.94,
      is_cod: true
    },
    conversation: [
      { sender: "BUYER", message: "Hi po! Order ulit ako 2 serum, same address lang po" },
      { sender: "SELLER", message: "Hello po! Noted, ₱698 COD po total. Confirm po?" },
      { sender: "BUYER", message: "Yes po confirm, salamat!" }
    ],
    risk_assessment: {
      risk_score: 12,
      risk_tier: "LOW",
      buyer_intent: "COMMITTED",
      confidence: "HIGH",
      recommended_action: "SHIP_NOW",
      reasons: [
        "Loyal repeat buyer with 6 successful deliveries and 0 RTS instances",
        "Complete and verified address with block, lot, phase, barangay and landmark",
        "Buyer explicitly re-confirmed order in chat ('Yes po confirm, salamat!')",
        "High regional courier delivery rate in Santa Rosa (94%)"
      ],
      key_moments: [
        "Hi po! Order ulit ako 2 serum, same address lang po",
        "Yes po confirm, salamat!"
      ],
      parsed_address: {
        house: "Blk 12 Lot 5 Phase 2, Mabuhay Homes",
        street: "",
        barangay: "Pooc",
        city: "Santa Rosa",
        province: "Laguna",
        zip: "4026",
        landmark: "near the basketball court",
        missing_fields: []
      },
      confirmation_message: "Salamat po ulit sa tiwala! 😊 Inihahanda na po namin ang inyong 2 bottles Collagen Glow Serum (₱698 COD). I-ship po namin agad via J&T Express!"
    },
    decision: {
      status: "ACCEPTED",
      action: "SHIP_NOW",
      actor: "Supervisor (Ops Team)",
      note: "Auto-verified repeat loyal customer",
      timestamp: "2026-10-15T07:12:00Z"
    },
    decision_history: [
      {
        action: "SHIP_NOW",
        actor: "Supervisor (Ops Team)",
        overrode_ai: false,
        note: "Auto-verified repeat loyal customer",
        timestamp: "2026-10-15T07:12:00Z"
      }
    ]
  }
];

export const SIMULATION_PRESETS = [
  {
    name: "High RTS Risk: Rush Payday Delay",
    channel: "Facebook Live",
    amount: 2199,
    items: [{ name: "Wireless Noise Cancelling Headphones", quantity: 1, price: 2199 }],
    raw_address: "Zone 4, Brgy. Mabolo, Bacoor, Cavite",
    conversation: [
      { sender: "BUYER", message: "mine headphones po" },
      { sender: "SELLER", message: "Noted po! ₱2,199 COD. Details po?" },
      { sender: "BUYER", message: "Bacoor cavite. pwede sa 30th pa deliver kasi wala pa pera?" }
    ],
    predicted: {
      risk_score: 84,
      risk_tier: "HIGH",
      buyer_intent: "HESITANT",
      confidence: "HIGH",
      recommended_action: "HOLD",
      reasons: [
        "Buyer asked for delivery on payday ('wala pa pera')",
        "Address missing house number and specific street",
        "Cavite regional RTS rate is significantly elevated (15.0%)"
      ],
      key_moments: [
        "pwede sa 30th pa deliver kasi wala pa pera?"
      ],
      parsed_address: {
        house: "Zone 4",
        street: "",
        barangay: "Mabolo",
        city: "Bacoor",
        province: "Cavite",
        zip: "4102",
        landmark: "",
        missing_fields: ["house", "street", "landmark"]
      },
      confirmation_message: "Kumusta po! 😊 Na-receive po namin ang order ninyong Wireless Headphones (₱2,199 COD). Pa-confirm po kung kailan pinaka-okay i-deliver at kung may exact house number po kayo sa Zone 4 Mabolo. Salamat po!"
    }
  },
  {
    name: "Medium Risk: Incomplete Barangay Address",
    channel: "TikTok Shop",
    amount: 1499,
    items: [{ name: "Stainless Steel Espresso Pot", quantity: 1, price: 1499 }],
    raw_address: "Km 34 National Highway, San Pedro, Laguna",
    conversation: [
      { sender: "BUYER", message: "Hello order po ako espresso pot" },
      { sender: "SELLER", message: "Hello! ₱1,499 COD. Complete address po?" },
      { sender: "BUYER", message: "Km 34 National Highway San Pedro Laguna tabi ng vulcanizing" }
    ],
    predicted: {
      risk_score: 42,
      risk_tier: "MEDIUM",
      buyer_intent: "COMMITTED",
      confidence: "HIGH",
      recommended_action: "CONFIRM_FIRST",
      reasons: [
        "Missing official barangay for courier routing",
        "Landmark provided ('tabi ng vulcanizing') aids delivery but requires barangay code",
        "First-time buyer with COD payment"
      ],
      key_moments: [
        "Km 34 National Highway San Pedro Laguna tabi ng vulcanizing"
      ],
      parsed_address: {
        house: "Km 34",
        street: "National Highway",
        barangay: "",
        city: "San Pedro",
        province: "Laguna",
        zip: "4023",
        landmark: "tabi ng vulcanizing",
        missing_fields: ["barangay"]
      },
      confirmation_message: "Magandang araw po! Maraming salamat sa order ninyong Espresso Pot (₱1,499 COD). Pwede po bang mahingi ang Barangay ninyo sa Km 34 National Highway para ma-dispatch na po agad sa J&T Express? Salamat po!"
    }
  },
  {
    name: "Low Risk: Verified Repeat Customer",
    channel: "Pancake POS",
    amount: 1199,
    items: [{ name: "Ceramic Cookware 24cm Pan", quantity: 1, price: 1199 }],
    raw_address: "House 18 Road 3, Dona Juana Subd., Brgy. Rosario, Pasig City 1609, yellow gate",
    conversation: [
      { sender: "BUYER", message: "Order po ulit ako, pan naman this time" },
      { sender: "SELLER", message: "Salamat po suki! ₱1,199 COD. Same Pasig address po ba?" },
      { sender: "BUYER", message: "Yes po, house 18 road 3 yellow gate. Thanks!" }
    ],
    predicted: {
      risk_score: 8,
      risk_tier: "LOW",
      buyer_intent: "COMMITTED",
      confidence: "HIGH",
      recommended_action: "SHIP_NOW",
      reasons: [
        "Repeat customer ('suki') with 100% historical delivery success",
        "Fully structured address with landmark ('yellow gate')",
        "Immediate affirmative confirmation in Messenger"
      ],
      key_moments: [
        "Order po ulit ako, pan naman this time",
        "Yes po, house 18 road 3 yellow gate. Thanks!"
      ],
      parsed_address: {
        house: "House 18 Road 3",
        street: "Dona Juana Subd.",
        barangay: "Rosario",
        city: "Pasig City",
        province: "Metro Manila",
        zip: "1609",
        landmark: "yellow gate",
        missing_fields: []
      },
      confirmation_message: "Maraming salamat po ulit suki! 😊 Inihahanda na po namin ang inyong Ceramic 24cm Pan (₱1,199 COD). Ipapa-pickup po namin agad kay rider today!"
    }
  }
];

export const COPILOT_KNOWLEDGE = {
  get_rts_summary: {
    total_orders: 1250,
    rts_orders: 137,
    rts_rate: 10.96,
    baseline_rts_rate: 15.8,
    estimated_savings: 68500,
    high_risk_held: 84,
    confirm_resolved: 42
  },
  get_region_trends: [
    {
      province: "Cavite",
      city: "Bacoor",
      total_orders: 320,
      rts_orders: 48,
      rts_rate: 15.0,
      average_risk_score: 71,
      courier_notes: "Route congestion in Molino corridor; high courier non-delivery"
    },
    {
      province: "Rizal",
      city: "Antipolo",
      total_orders: 210,
      rts_orders: 26,
      rts_rate: 12.38,
      average_risk_score: 65,
      courier_notes: "Upper Antipolo mountain routes lack house numbering"
    },
    {
      province: "Bulacan",
      city: "San Jose Del Monte",
      total_orders: 195,
      rts_orders: 23,
      rts_rate: 11.79,
      average_risk_score: 61,
      courier_notes: "Resettlement areas with duplicate street names"
    },
    {
      province: "Laguna",
      city: "Santa Rosa / Cabuyao",
      total_orders: 280,
      rts_orders: 22,
      rts_rate: 7.86,
      average_risk_score: 54,
      courier_notes: "Gated subdivisions require guardhouse clearance"
    },
    {
      province: "Metro Manila",
      city: "Quezon City / Pasig",
      total_orders: 245,
      rts_orders: 18,
      rts_rate: 7.35,
      average_risk_score: 42,
      courier_notes: "Dense condo units requiring lobby reception drops"
    }
  ],
  get_product_rts_rate: [
    {
      product_id: "P101",
      product_name: "Wireless Earbuds Pro",
      total_orders: 320,
      rts_orders: 48,
      rts_rate: 15.0,
      category: "Electronics"
    },
    {
      product_id: "P103",
      product_name: "Bluetooth Speaker XB-20",
      total_orders: 260,
      rts_orders: 32,
      rts_rate: 12.31,
      category: "Electronics"
    },
    {
      product_id: "P304",
      product_name: "LED Ring Light 10in",
      total_orders: 180,
      rts_orders: 20,
      rts_rate: 11.11,
      category: "Accessories"
    },
    {
      product_id: "P205",
      product_name: "Air Fryer 5L Touch Control",
      total_orders: 220,
      rts_orders: 18,
      rts_rate: 8.18,
      category: "Home Appliances"
    },
    {
      product_id: "P402",
      product_name: "Kids School Bag Set",
      total_orders: 150,
      rts_orders: 11,
      rts_rate: 7.33,
      category: "Bags"
    },
    {
      product_id: "P501",
      product_name: "Collagen Glow Serum 30ml",
      total_orders: 120,
      rts_orders: 8,
      rts_rate: 6.67,
      category: "Beauty"
    }
  ]
};

export const DASHBOARD_STATS = {
  kpis: {
    total_orders_scored: 1250,
    current_rts_rate: 9.2, // with FlowGuard AI
    baseline_rts_rate: 15.8, // historical without AI
    rts_reduction_pct: 41.8,
    estimated_pesos_saved: 184500,
    high_risk_flagged: 137,
    auto_passed_loyal: 812
  },
  weekly_rts_trend: {
    labels: ["W1 (Sept 1-7)", "W2 (Sept 8-14)", "W3 (Sept 15-21)", "W4 (Sept 22-28)", "W5 (Oct 1-7)", "W6 (Oct 8-15)"],
    baseline: [16.2, 15.8, 16.5, 15.4, 15.9, 15.8],
    with_flowguard: [16.2, 14.1, 12.4, 11.0, 9.8, 9.2]
  },
  savings_breakdown: [
    { label: "Failed Courier Two-Way Shipping Fees (₱180 avg)", value: 74200 },
    { label: "Damaged / Depreciated Perishable Goods", value: 52100 },
    { label: "Lost Capital In Limbo (Unreleased Inventory)", value: 43200 },
    { label: "Customer Service Overhead Re-scheduling", value: 15000 }
  ]
};
