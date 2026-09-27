#!/usr/bin/env python3
"""Generate a high-entropy kennel API bearer token and its SHA-256 database hash.

The clear token is shown once in the terminal. Store it in an approved secret
manager/device credential store. Only the SHA-256 hash belongs in access_tokens.
"""
import argparse, hashlib, secrets, sys, uuid

p=argparse.ArgumentParser()
p.add_argument("--facility-id", required=True)
p.add_argument("--subject", required=True)
p.add_argument("--display-name", required=True)
p.add_argument("--role", required=True, choices=["manager","attendant","driver","reception","auditor","owner"])
p.add_argument("--animal-id", default=None)
args=p.parse_args()

try:
    uuid.UUID(args.facility_id)
    if args.animal_id:
        uuid.UUID(args.animal_id)
except ValueError as e:
    sys.exit(f"Invalid UUID: {e}")

if args.role=="owner" and not args.animal_id:
    sys.exit("--animal-id is required for owner tokens")
if args.role!="owner" and args.animal_id:
    sys.exit("--animal-id is only valid for owner tokens")

token="gk_"+secrets.token_urlsafe(48)
digest=hashlib.sha256(token.encode()).hexdigest()
token_id=str(uuid.uuid4())

animal_sql="NULL" if not args.animal_id else f"'{args.animal_id}'::uuid"
safe_subject=args.subject.replace("'","''")
safe_name=args.display_name.replace("'","''")

print("CLEAR TOKEN — STORE SECURELY; DO NOT COMMIT:")
print(token)
print("\nINSERT THIS HASHED RECORD INTO NEON:")
print(
    "INSERT INTO access_tokens(id,facility_id,token_hash,subject,display_name,role,animal_id) VALUES("
    f"'{token_id}'::uuid,'{args.facility_id}'::uuid,'{digest}','{safe_subject}','{safe_name}','{args.role}',{animal_sql});"
)
