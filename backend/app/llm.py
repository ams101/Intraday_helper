
import os, json
from openai import OpenAI
from .rl import redis_client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY",""))
MODEL = os.getenv("OPENAI_MODEL","gpt-5")
def hint(metric:str, context:dict)->str:
    r=redis_client(); key=f"hint:{metric}:{hash(json.dumps(context,sort_keys=True))}"
    c=r.get(key)
    if c: return c
    msg=client.chat.completions.create(model=MODEL, messages=[{"role":"user","content":f"In ONE short sentence, explain {metric} in numeric terms. Context: {json.dumps(context)}"}], max_tokens=60, temperature=0.1)
    txt=msg.choices[0].message.content.strip(); r.setex(key,300,txt); return txt
def analyze(symbol:str, snapshot:dict)->dict:
    r=redis_client(); key=f"analyze:{symbol}:{hash(json.dumps(snapshot,sort_keys=True))}"
    c=r.get(key)
    if c: return json.loads(c)
    msg=client.chat.completions.create(model=MODEL, messages=[{"role":"user","content":f"Decide long/short/skip for {symbol}. Snapshot:{json.dumps(snapshot)}. Return JSON with decision, bands [u,l], confidence 0..1, checks {{}}."}], max_tokens=200, temperature=0.0)
    try: data=json.loads(msg.choices[0].message.content)
    except: data={"decision":"skip","bands":[1.0,1.0],"confidence":0.5,"checks":{}}
    r.setex(key,60,json.dumps(data)); return data
