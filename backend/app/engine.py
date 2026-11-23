
from __future__ import annotations
from typing import Any, Dict, List
import os, json, time
from .rl import redis_client

def minute_snapshot(symbol: str) -> Dict[str, Any]:
    r = redis_client(os.getenv("REDIS_URL"))
    raw = r.get(f"snap:{symbol}")
    if not raw:
        raise RuntimeError(f"live snapshot not available for {symbol}")
    snap = json.loads(raw)
    snap["fresh_ms"] = int(time.time()*1000) - int(snap.get("ts_ms", int(time.time()*1000)))
    return snap

def plan(universe: List[str], top_n: int = 30) -> List[Dict[str, Any]]:
    r = redis_client(os.getenv("REDIS_URL"))
    rows: List[Dict[str, Any]] = []
    for sym in universe[:1000]:
        raw = r.get(f"snap:{sym}")
        if not raw: continue
        s = json.loads(raw)
        side = "long" if (s.get("ema9") or 0) > (s.get("ema21") or 0) else "short"
        score = (50.0 + (10 if (s.get("minute_vol_multiple") or 0) >= 1.4 else -5) +
                 (5 if (s.get("vwap_delta_pct") or 0) >= 0 else -2))
        rows.append({
            "strategy": "Ensemble",
            "symbol": sym,
            "side": side,
            "score": round(score,2),
            "readiness": "enter" if s.get("minute_vol_multiple",0)>=1.4 else "wait",
            "bands": {"upper": 1.18, "lower": 0.84},
            "checks": {"vwapRespect": (s.get("vwap_delta_pct") or 0) >= 0, "VolX": (s.get("minute_vol_multiple") or 0) >= 1.4},
            "note": ""
        })
    rows.sort(key=lambda r: r["score"], reverse=True)
    return rows[:top_n]
