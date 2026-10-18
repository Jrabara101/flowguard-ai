# FlowGuard AI: 3-minute demo video script (voice-over)

About 420 words of narration, which is roughly 2:50 at a calm pace. Record on the live URL in Chrome at 1920×1080, browser zoom 90%, bookmarks bar hidden.
**Bold** = what to click. Narration is in quotes. Times are targets, not limits.

**Before recording**
- Open https://flowguard-79354024474.asia-southeast1.run.app and wait for the queue to load.
- Do one Simulate run off-camera first, so Gemini is warm (the first call after idle is slower).
- Check that order **#2029** (HIGH, 88) is in the queue. If it isn't, use whichever HIGH order is at the top and change the number in the script.
- Close other tabs and notifications.

---

## 0:00 – 0:20 · The problem (Action Queue, nothing clicked)

> "In the Philippines, a lot of online selling happens in Messenger and live selling, and most of it is cash on delivery. When a buyer refuses the parcel, it comes back, and the seller pays shipping both ways. In our demo shop, one in five orders came back. FlowGuard AI uses Gemini to catch those orders before the waybill is printed."

## 0:20 – 0:55 · A HIGH-risk order (click **#2029**)

> "This is the Action Queue. Gemini Flash has already scored every new order from zero to a hundred. Order 2029 scored 88: high risk, so the recommendation is to hold."

**Point at the reasons list.**

> "It explains why in plain words: the buyer has three returns out of four past orders, and they asked to change the address without giving the new one."

**Click View Full Conversation**, pause two seconds on the gold lines, then close it.

> "And it quotes the exact chat lines that drove the score, highlighted in gold, so the supervisor can check the AI’s reasoning in seconds."

## 0:55 – 1:20 · Address and message (scroll down in the detail panel)

> "Gemini also parses the Philippine address and flags what the courier will need, like a missing barangay or landmark. Then it drafts a polite Taglish message asking the buyer to confirm, ready to copy into Messenger."

**Click Copy Message.**

## 1:20 – 1:45 · A live order (click **Simulate Order**, then **Score Order Now**)

> "Let’s score a brand-new order live. FlowGuard sends the order, the chat and the buyer’s history to Gemini Flash on Vertex AI. The response comes back as structured JSON, and our server checks it before it reaches the screen."

Wait for the toast (about 10 s). Read out the result:

> "Here it is: order [number], [tier], score [score]. It’s now at the top of the queue."

## 1:45 – 2:00 · The human decides (click **Accept** on the new order)

> "The supervisor accepts or overrides, and every decision is logged, including when a person disagrees with the AI."

## 2:00 – 2:30 · Copilot (click **Ops Copilot**, type the question)

Type: **Why is order #2029 on hold?** and press Enter.

> "Managers can just ask. The Ops Copilot runs on Gemini Pro with function calling. It decides which of five read-only database tools to call, here get order details, and answers only from the real data."

Then click the suggestion **Which provinces had the highest RTS rate this week?**

> "It can also spot problem routes. Location here describes courier performance on a route, never the people who live there."

## 2:30 – 2:55 · Results (click **Analytics Dashboard**)

> "Does the score work? We backtested it on 150 past orders. Low-risk orders came back 5 percent of the time; high-risk ones 35 percent. Holding the high tier would have caught 70 percent of all returns and cut the return rate of shipped orders from 18 to about 8 percent. About a third of orders get a confirmation message first, which is why FlowGuard confirms and never cancels."

## 2:55 – 3:00 · Close (stay on the dashboard)

> "FlowGuard AI: ship the good orders, confirm the risky ones. Built on Gemini and Google Cloud. Salamat po!"

---

## If something goes wrong while recording

- **Simulate takes longer than 15 s:** keep talking about the pipeline; it usually returns within 20 s. If it shows an error, cut that part and re-record just that scene.
- **Simulate says "No more incoming orders":** 17 were left on Oct 17. Ask the developer to re-seed or score more pending orders.
- **Copilot answer is long:** scroll so the tool badge and the table are visible, and summarize it in your own words.
- **Numbers differ from the script:** the dashboard is the source of truth. Read what it shows.

## Data notes for questions

- All data is synthetic; no real customers.
- Backtest: 150 past orders scored by gemini-3.8-flash on the deployed system. LOW 5.4% (2/37), MEDIUM 10.2% (6/59), HIGH 35.2% (19/54) returned; 70.4% of returns in HIGH; shipped-order RTS 18% → 8.3%; 36% of orders held for confirmation; ₱4,297 shipping saved in the sample, about ₱57,293 scaled to 2,000 orders.
