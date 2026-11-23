# Intraday Co-Pilot: product spec

Status: draft v1 · Owner: you · Last updated: 2026-11-24

## 1. What it is

An AI co-pilot for intraday trading on Indian stocks. It reads the market,
finds opportunities with a library of proven intraday playbooks, and explains
each one with evidence: what is happening now, how often this situation worked
before, what is different this time, and the likely range of outcomes. The
trader makes the call.

Two goals, in order:

1. **A tool its owner uses on trading days** to make better-informed calls and
   to avoid trading against the market's direction.
2. **A portfolio piece**, linked from the portfolio site, that shows a
   reliable, honest, AI-driven product built on messy real-world data.

It is for personal use. It is not sold, does not place orders, and does not
give investment advice.

## 2. Users

| User | Wants | Leaves with |
|---|---|---|
| **Owner (trader)** | A fast read of the watchlist, setups worth a look with reasons, no noise | "I know what the market is doing and what this setup has historically done" |
| **Portfolio visitor** (recruiter, engineer, founder) | To see it working and judge the quality quickly | "This person handles messy data, honest backtesting, responsible AI and production operations" |

## 3. Principles

Use these to settle conflicts between features.

1. **Evidence over opinion.** Every claim shows a number, a sample size and a range.
2. **Suggest, never instruct.** "Indicators suggest…". The trader decides.
3. **Honest about uncertainty.** Stale data, small samples and weak playbooks are shown, not hidden.
4. **One engine everywhere.** Live, replay and backtest run the same code.
5. **Fail gracefully.** No live data: replay still works. No AI: the numbers still work.
6. **Small and deep.** A watchlist of 10–15 stocks and 5 excellent playbooks beat a 3,000-stock scanner.

## 4. Product pillars

| Pillar | Job |
|---|---|
| **A. Collect** | Get dependable data from unreliable sources |
| **B. Think** | Turn data into ranked opportunities backed by evidence |
| **C. Show** | Make the evidence readable in seconds |
| **D. Reflect** | Improve the trader's judgment over time |
| **E. Prove** | Earn trust from the owner and from visitors |

## 5. Features (MoSCoW)

### Must have

| Pillar | Feature | Why |
|---|---|---|
| A | BSE live collector with per-stock scheduling, retries with backoff and stale flags | The source is slow and drops requests; everything depends on this |
| A | Candle builder: 1-minute candles from snapshots, rolled up to 5 and 15 minutes, with a "warming up" state | BSE provides no candles |
| A | Hugging Face history pipeline: 1-minute NSE candles from 2022 to the latest update | Replay, backtests and training |
| A | Market calendar: trading days, holidays, special sessions | Correct sessions and labels |
| B | Indicators: VWAP, EMA 9/21, RSI, volume vs normal, opening range, Bollinger, ATR, CPR and pivots, previous-day high/low/close | What the co-pilot reads |
| B | **Market tide**: index trend, breadth, regime (trending or ranging, calm or volatile) | Never fight the market's direction; picks the right playbook |
| B | **Playbook library**: about 5 detectors at first, each with a trade plan (entry, stop, target, what cancels it, time stop) | How opportunities are found and handled |
| B | **Outcome labels**: target hit, stop hit, or closed at 15:15 | Defines "it worked", so every probability can be checked |
| B | **Backtest per playbook**, by regime and time of day, with costs included | Shows what has worked and what has not |
| B | **Probability engine**: base rates, a calibrated trained model (LightGBM), retrieval of similar past situations (nearest neighbours), outcome ranges (quantile models), and what pushed the estimate up or down (SHAP) | The "smart AI": evidence-backed estimates |
| B | **Meta-model** that picks the playbook suited to the current regime | The co-pilot's "algorithm of its own" |
| B | Fair testing: walk-forward splits, a CI test that fails on any use of future data, comparison with baselines | Makes the numbers believable |
| C | **Opportunity feed**: ranked cards with playbook, direction, reasons, estimated chance and levels | The main live view |
| C | **Trade Brief** (on-demand Analyze, may take up to a minute): why now, similar past cases, what is different, estimated chance, outcome range, levels, a short read | The core experience (example in section 7) |
| C | Stock detail: chart on 1/5/15-minute candles, indicators, playbook signals | Depth on demand |
| C | **Replay any past date** at 1× to 60× speed, running the same engine on history | Works 24/7; the best demo; a way to test strategies |
| C | **Playbook report cards**: historical results by regime, time and stock; live health | Shows what works and what does not, openly |
| D | Paper-trading log: every suggestion, with the owner's call and the outcome | Measures the real edge before any money is used |
| E | Model card for each model version: test results, calibration, data range | Production-grade ML that visitors can see |
| E | Status page: data freshness, collector health, last successful run | Operations that visitors can see |
| E | Owner login, read-only public demo, collector endpoint that accepts only signed scheduler calls | The link is public |
| E | "Indicators suggest, not advice" disclaimer | Needed when signals are shown publicly |
| E | Tests, CI, automatic Vercel deploys | "Production-grade" in practice |

### Should have

| Pillar | Feature | Why |
|---|---|---|
| B | AI analyst (chat model through OpenRouter): writes the read from engine numbers only; its output is checked against those numbers | The "AI-enabled" experience without made-up numbers |
| B | Live track record: every live estimate logged and later compared with what happened | Proves the engine on data it has never seen |
| B | Drift alerts: live input values compared with training values | Catches the history/live difference early (section 8) |
| B | Monthly retraining when the dataset updates | Keeps the model current |
| C | Setup-cancelled alerts ("price fell back below VWAP") | Keeps watching after a suggestion |
| C | Browser notifications for high-scoring opportunities | No need to watch the screen |
| D | **"Your call" quiz in replay**: decide first, then see the co-pilot's call and the outcome; tracks the owner's hit rate against the co-pilot's | Trains judgment; a memorable demo |
| D | Daily plan, loss and trade-count limits, nudges when a rule is broken | Discipline |
| D | End-of-day review written by the AI | Closes the daily loop |
| D | Settings editor for playbook thresholds | Tuning without code changes |

### Could have

- More playbooks (up to 15–20): gap-and-go, gap fill, narrow-range breakout, failed-breakout trap, Supertrend, Camarilla, volume profile, relative strength against the index or sector
- Sector-level tide
- Telegram alerts
- Installable as a phone app (PWA)

### Won't have (in this version)

Placing orders or connecting a broker · options/F&O · a full-market scanner ·
tick data · multiple users or payments · news and sentiment · deep learning.

## 6. User journeys

- **Before the open (8:45):** market context, today's levels (CPR, previous day high/low), and which playbooks suit the expected regime.
- **Live (9:15–15:30):** the opportunity feed ranks setups. Open one, read the brief, log the call. Get told if the setup is cancelled.
- **Deep dive (any time):** Analyze a stock now or at a moment on a past date. The full brief arrives within a minute.
- **After the close:** what happened to each signal, the owner's calls against the co-pilot's, the AI review.
- **Portfolio visitor (any hour):** lands on a replay of a strong past day, watches opportunities appear and resolve, then opens a report card and the model card.

## 7. The Trade Brief

The co-pilot's core output. Every line is computed from data. The chat model
only writes the final "Read" from these numbers.

> **RELIANCE: indicators suggest LONG** · playbook: VWAP pullback · 10:42 · market tide: rising
>
> **Why now:** pulled back to VWAP (+0.1%) and held; volume 2.3× normal; EMA 9 above EMA 21 on 1, 5 and 15 minutes; RSI 56; SENSEX +0.6%, 70% of stocks rising.
>
> **Has this happened before?** 214 similar situations since 2022 (closest: TCS 14 Mar 2025, HDFCBANK 2 Jul 2024, … each one replayable). 59% hit the target first, 31% hit the stop, 10% closed at 15:15.
>
> **What's different now:** volume stronger than in the past cases (+); later in the day than most (−); firmer market (+).
>
> **Estimated chance of success:** 57–64% (central 61%) · **Expected result after costs:** −0.4% to +0.9%, middle +0.3%
>
> **Plan:** entry 1352.5 · stop 1347.1 · target 1361.2 · cancel if it closes back below VWAP · time stop 45 min
>
> **Read:** a trend-continuation setup that has worked more often than not in this context; the main risk is the late timing. *Indicators suggest, not advice.*

| Line | Method |
|---|---|
| Similar situations | Nearest-neighbour search over scaled indicator vectors, weighted by how much each input matters |
| Their outcomes | Counted from the outcome labels |
| What's different | The current situation compared with its neighbours, plus SHAP |
| Estimated chance | LightGBM, calibrated |
| Outcome range | Quantile LightGBM (10th, 50th and 90th percentile), after costs |
| Read | Chat model, using the numbers above only; checked against them |

Replay only looks backwards: on a past date, similar situations and models use
only data from before that date. Dates the model was trained on are labelled
"seen in training".

## 8. How the intelligence works

The pipeline runs every minute live, and on demand for Analyze or replay:

1. **Scan:** run every playbook detector on the watchlist at 1, 5 and 15 minutes.
2. **Read the regime:** tide, trend or range, volatility.
3. **Choose:** the meta-model favours the playbooks that have historically worked in this regime.
4. **Score:** the probability engine estimates the chance of success and the outcome range.
5. **Plan and explain:** levels, what cancels the setup, the brief.
6. **Watch:** flag when a setup is cancelled.

**Training (offline, monthly):** about 100 liquid stocks from the Hugging Face
data produce an event library: every past moment a playbook fired, with its
inputs and outcome. The models train on it with walk-forward splits. Every
model is versioned and has a model card.

**The history/live difference.** The models learn from clean NSE 1-minute
candles with exact volume. Live data is candles built from BSE snapshots taken
about once a minute, with BSE's much smaller volume. Three things handle this:

- Only relative inputs (volume against that stock's own normal, % distances), never absolute values.
- Training on history degraded to look like live data: uneven timing and missed minutes.
- Drift monitoring that compares live input values with training values.

**Inputs that exist only live** (BSE's top 5 bid/ask levels) are shown as
context and never used as model inputs, because the history has no order-book
data.

## 9. Architecture (Vercel)

| Part | Choice |
|---|---|
| Frontend | Next.js; refreshes data every 10–15 s; replay player |
| API and engine | Python (FastAPI) as Vercel functions; the same engine package is used offline |
| Scheduler | Upstash QStash, every minute in market hours, with retries; calls a signed `/api/collect` |
| Storage | Neon Postgres for snapshots, candles, signals, journal and the track record |
| Replay and event library | Precomputed files in Vercel Blob, queried with DuckDB |
| Models | Trained offline and exported to small files that the API loads |
| Offline pipeline | Python scripts, run locally or with GitHub Actions: download history, label, backtest, train, publish |
| AI | OpenRouter (the free router first); cached; optional |

## 10. Releases

Releases are ordered by risk, not by feature.

| Release | Contents | Exit criteria |
|---|---|---|
| **R0: Evidence** | History pipeline, outcome labels, 5 playbooks backtested; check whether BSE answers Vercel's servers | An evidence report saying which playbooks have an edge after costs; a go/no-go on live BSE |
| **R1: Replay MVP** | Foundations, replay any date, opportunity cards with base rates, report cards, deployed and linked from the portfolio | A visitor can replay a day and understand a card in 10 seconds |
| **R2: Live** | Collector, live candles, live feed, status page, owner login, paper-trading log | During market hours, 95% or more of stocks are under 2 minutes old |
| **R3: Smart** | Trained model, similar-situation retrieval, outcome ranges, SHAP, 5/15-minute inputs, regime and meta-model, Trade Brief, AI read | The model beats base rates on unseen data and is well calibrated |
| **R4: Judgment** | Quiz, daily plan and limits, nudges, end-of-day review, drift alerts, retraining | Used on 15 or more trading days a month |

**Evidence gate after R0.** If fewer than 2 playbooks show an edge after costs,
the product becomes "the co-pilot that tells you what not to trade": it shows
which popular setups fail, and in which regimes. Nothing built up to that point
is wasted.

## 11. Metrics

| Level | Metric |
|---|---|
| North star | Trade Briefs reviewed with a logged call, per week |
| Model | Calibration error on unseen data; win rate against baseline after costs; live track record |
| Data | Share of stocks that are fresh in market hours; collector success rate |
| Demo | Time for a visitor to understand a card; replay load time under 3 s |
| Guardrails | No use of future data (enforced in CI); every number shows its sample size; AI text never contradicts the numbers |

## 12. Risks

| Risk | Mitigation |
|---|---|
| No playbook has an edge | Evidence gate; "what not to trade" fallback |
| BSE blocks Vercel or changes its page | R1 doesn't need live data; a collector on a laptop as fallback; tests that catch page-layout changes |
| History and live data differ | Relative inputs only, degraded training data, drift alerts |
| Backtests look better than reality | Same engine everywhere, the CI future-data test, walk-forward testing, sample sizes shown |
| Free-tier limits | Batched writes, caching, precomputed files |
| Scope is too big for the time available | Releases ordered by risk; 5 playbooks before 20 |

## 13. Decisions so far

- For personal use and as a portfolio piece, not a business
- Hosted on Vercel
- BSE mobile site for live data, scheduled per stock with retries
- Hugging Face history for replay, backtests and training
- Candles built in-house
- "Indicators suggest" wording
- Tree models plus retrieval of similar situations; no deep learning
- The chat model explains and never produces numbers
- One engine for live, replay and backtest

## 14. Open questions

1. Which 10–15 stocks are on the watchlist? They must be listed on BSE and present in the Hugging Face NSE data.
2. Can portfolio visitors run Analyze themselves (cached and rate-limited), or only see stored examples?
3. Which 5 playbooks come first? Proposed: opening-range breakout with retest, VWAP pullback, VWAP stretch reversion, previous-day high/low break, CPR.
