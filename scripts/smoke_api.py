#!/usr/bin/env python3
"""Authenticated post-deploy smoke test for the kennel command centre API."""
import json, os, sys, urllib.request, urllib.error

base=os.environ.get("KENNELS_BASE_URL","").rstrip("/")
token=os.environ.get("KENNELS_API_TOKEN","")
if not base or not token:
    sys.exit("Set KENNELS_BASE_URL and KENNELS_API_TOKEN")

def call(path, auth=True):
    headers={"accept":"application/json"}
    if auth: headers["authorization"]="Bearer "+token
    req=urllib.request.Request(base+path,headers=headers,method="GET")
    try:
        with urllib.request.urlopen(req,timeout=20) as r:
            data=json.loads(r.read().decode())
            return r.status,data
    except urllib.error.HTTPError as e:
        try: body=json.loads(e.read().decode())
        except Exception: body={}
        return e.code,body

checks=[]
for path,auth in [("/api/health",False),("/api/session",True),("/api/dashboard",True),("/api/animals",True),("/api/audit",True)]:
    status,data=call(path,auth)
    checks.append((path,status,data))
    if status!=200:
        print(f"FAIL {path}: HTTP {status} {data}")
        sys.exit(1)
    print(f"PASS {path}: HTTP 200")

session=checks[1][2]
if not session.get("facilityId") or not session.get("role"):
    sys.exit("FAIL /api/session did not return facilityId and role")

print("SMOKE GREEN")
