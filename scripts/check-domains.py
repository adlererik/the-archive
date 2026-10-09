#!/usr/bin/env python3
"""Erik Adler: check registry RDAP without treating DNS absence as availability."""
import concurrent.futures
import datetime
import json
from pathlib import Path
import socket
import urllib.error
import urllib.request

def fetch(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "The-Archive-domain-research/1.0", "Accept": "application/rdap+json, application/json"}), timeout=25)

bootstrap = json.load(fetch("https://data.iana.org/rdap/dns.json"))
endpoints = {tld: urls[0] for tlds, urls in bootstrap["services"] for tld in tlds}
domains = [f"chocolatesweetcake.{tld}" for tld in ("com", "net", "org", "me")]
domains += [f"{name}.{tld}" for name in ("ellieadlersworld", "elliesarchive", "elliesworld") for tld in ("com", "net", "org", "me", "life", "family")]

def check(domain):
    base = endpoints.get(domain.rsplit(".", 1)[1])
    url = base.rstrip("/") + "/domain/" + domain if base else None
    result = {"domain": domain, "rdap_url": url, "checked_at": datetime.datetime.now(datetime.timezone.utc).isoformat()}
    if domain.endswith('.me') and not url:
        result['whois_server'] = 'whois.nic.me'  # Published by IANA for .me.
        try:
            with socket.create_connection(('whois.nic.me', 43), timeout=15) as connection:
                connection.settimeout(15)
                connection.sendall((domain + '\r\n').encode('ascii'))
                data = b''
                while chunk := connection.recv(8192):
                    data += chunk
                    if len(data) > 200000:
                        break
            text = data.decode('utf-8', errors='replace').lower()
            status = 'not_registered' if any(marker in text for marker in ('not found', 'no match', 'no data found')) else 'registered' if 'domain name:' in text else 'unknown'
            return result | {'status': status, 'protocol': 'whois'}
        except Exception as error:
            return result | {'status': 'unknown', 'detail': str(error)}
    if not url:
        return result | {"status": "unknown", "detail": "No IANA RDAP endpoint"}
    try:
        with fetch(url) as response:
            json.load(response)
            return result | {"status": "registered", "http": response.status}
    except urllib.error.HTTPError as error:
        return result | {"status": "not_registered" if error.code == 404 else "unknown", "http": error.code}
    except Exception as error:
        return result | {"status": "unknown", "detail": str(error)}

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    results = list(pool.map(check, domains))
output = Path("work/cloudflare/domain-rdap.json")
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(results, indent=2))
for result in results:
    print(result["domain"], result["status"], result.get("http", result.get("detail", "")))
print("A registry 404 means no registration record; Cloudflare checkout must confirm that the domain is registrable and its price.")
