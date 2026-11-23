
from __future__ import annotations
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
import os, time
from .utils import rid
from .rl import redis_client, token_bucket
from .models import APIResponse, Policy, HintIn
from .kite import get_kite
from .engine import plan, minute_snapshot
from . import llm

app = FastAPI(title="Intraday Co-Pilot API")
origins=[x.strip() for x in os.getenv("CORS_ORIGINS","http://127.0.0.1:3000").split(",") if x.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
r = redis_client(os.getenv("REDIS_URL","redis://redis:6379/0"))

@app.get("/healthz")
def healthz(): return {"redis": bool(r.ping())}

@app.get("/api/session")
def api_session():
    k=get_kite()
    stale_count = int(r.get("stat:stale_count") or 0)
    subs = r.scard("active_tokens") or 0
    limit = int(r.get("cfg:universe_limit") or os.getenv("UNIVERSE_LIMIT", 200))
    return {"zerodha": bool(k.access_token), "llm": True, "ticker": subs>0, "stale_count": stale_count, "subscribed_count": subs, "universe_limit": limit}

@app.get("/kite/login_url")
def kite_login_url():
    return {"login_url": get_kite().login_url()}

@app.get("/callback")
def kite_callback(request_token: str):
    get_kite().exchange_for_token(request_token)
    return RedirectResponse(url="http://127.0.0.1:3000/auth/redirect?ok=1")

def _rate(name): ok,wait=token_bucket(name,10,3.0); 
# noqa

@app.get("/api/plan")
def api_plan(top:int=30):
    ok,wait=token_bucket("plan",10,3.0)
    if not ok: raise HTTPException(status_code=429, detail="rate limited", headers={"Retry-After": str(wait)})
    # Universe symbols should be stored under set 'symbols:active'
    syms = list(r.smembers("symbols:active")) or []
    rows = plan(syms, top_n=top)
    return {"ok": True, "request_id": rid(), "duration_ms": 0, "data": rows}

@app.get("/api/live")
def api_live(symbols:str):
    ok,wait=token_bucket("live",20,5.0)
    if not ok: raise HTTPException(status_code=429, detail="rate limited", headers={"Retry-After": str(wait)})
    out={}
    for s in [x.strip() for x in symbols.split(",") if x.strip()]:
        out[s]=minute_snapshot(s)
    return {"ok": True, "request_id": rid(), "duration_ms": 0, "data": out}

@app.get("/api/analyze")
def api_analyze(symbol:str):
    ok,wait=token_bucket("analyze",6,1.0)
    if not ok: raise HTTPException(status_code=429, detail="rate limited", headers={"Retry-After": str(wait)})
    snap=minute_snapshot(symbol)
    data=llm.analyze(symbol, snap)
    return {"ok": True, "request_id": rid(), "duration_ms": 0, "data": data}

@app.post("/api/hint")
def api_hint(body: HintIn):
    ok,wait=token_bucket("hint",10,2.0)
    if not ok: raise HTTPException(status_code=429, detail="rate limited", headers={"Retry-After": str(wait)})
    text=llm.hint(body.metric, body.context)
    return {"ok": True, "request_id": rid(), "duration_ms": 0, "data": {"hint": text}}

@app.get("/api/policy")
def api_policy_get():
    import json, pathlib
    p = pathlib.Path(__file__).with_name("policy.json")
    return json.loads(p.read_text())

@app.post("/api/policy")
def api_policy_post(obj: Policy):
    import json, pathlib
    p = pathlib.Path(__file__).with_name("policy.json")
    p.write_text(json.dumps(obj.model_dump(), indent=2))
    return {"ok": True}

@app.post("/api/journal")
def api_journal_add(symbol: str = Body(...), action: str = Body(...), note: str | None = Body(default=None)):
    r.lpush("journal", f"{symbol}|{action}|{note or ''}"); r.ltrim("journal", 0, 999); return {"ok": True}

@app.get("/api/journal")
def api_journal_list():
    vals = r.lrange("journal", 0, 100); out=[]
    for v in vals:
        sym, ac, note = v.split("|", 2); out.append({"symbol": sym, "action": ac, "note": note})
    return out

@app.get("/api/config")
def api_get_config():
    pinned = sorted(list(r.smembers("cfg:pinned") or []))
    limit = int(r.get("cfg:universe_limit") or os.getenv("UNIVERSE_LIMIT", 200))
    return {"pinned": pinned, "universe_limit": limit}

@app.post("/api/config")
def api_set_config(pinned: list[str] = Body(default=None), universe_limit: int | None = Body(default=None)):
    if pinned is not None:
        r.delete("cfg:pinned")
        if pinned: r.sadd("cfg:pinned", *pinned)
    if universe_limit is not None:
        r.set("cfg:universe_limit", int(universe_limit))
    return {"ok": True}
