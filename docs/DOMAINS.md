# Domain research

By Erik Adler. October 9, 2026.

Registry checks were performed from the terminal using IANA-discovered RDAP endpoints. The `.me` registry has no endpoint in the IANA RDAP bootstrap, so `.me` checks used its IANA-listed `whois.nic.me` server on port 43. No registrant contact data was retained.

“No registration found” is a preliminary availability signal, not a reservation or definitive Cloudflare purchase offer. Reserved or premium names may differ. Cloudflare checkout must confirm each domain’s availability and price.

## Domains with no registration found

Prices are USD for a standard one-year registration and subsequent one-year renewal, from [Cloudflare’s official price list](https://pricing.registrar.cloudflare.com/). They include registry charges and applicable ICANN fees; do not add another ICANN fee. Taxes based on billing details and premium pricing are separate. The `.org` first-year price is the current promotion; its regular registration/renewal price is $11.20.

| Domain | First year | Renewal/year | Registry check |
| --- | ---: | ---: | --- |
| chocolatesweetcake.com | $10.46 | $10.46 | RDAP: 404 |
| chocolatesweetcake.net | $11.86 | $11.86 | RDAP: 404 |
| chocolatesweetcake.org | $8.50 | $11.20 | RDAP: 404 |
| chocolatesweetcake.me | $16.56 | $16.56 | WHOIS: no match |
| ellieadlersworld.com | $10.46 | $10.46 | RDAP: 404 |
| ellieadlersworld.net | $11.86 | $11.86 | RDAP: 404 |
| ellieadlersworld.org | $8.50 | $11.20 | RDAP: 404 |
| ellieadlersworld.me | $16.56 | $16.56 | WHOIS: no match |
| ellieadlersworld.life | $28.20 | $28.20 | RDAP: 404 |
| ellieadlersworld.family | $30.20 | $30.20 | RDAP: 404 |
| elliesarchive.net | $11.86 | $11.86 | RDAP: 404 |
| elliesarchive.org | $8.50 | $11.20 | RDAP: 404 |
| elliesarchive.me | $16.56 | $16.56 | WHOIS: no match |
| elliesarchive.life | $28.20 | $28.20 | RDAP: 404 |
| elliesarchive.family | $30.20 | $30.20 | RDAP: 404 |
| elliesworld.net | $11.86 | $11.86 | RDAP: 404 |
| elliesworld.org | $8.50 | $11.20 | RDAP: 404 |
| elliesworld.me | $16.56 | $16.56 | WHOIS: no match |
| elliesworld.life | $28.20 | $28.20 | RDAP: 404 |
| elliesworld.family | $30.20 | $30.20 | RDAP: 404 |

## Already registered

- elliesarchive.com
- elliesworld.com

Checks are time-sensitive. Run `python3 scripts/check-domains.py` from the project folder to refresh the terminal results. Raw status records and registry endpoint URLs are saved under ignored `work/cloudflare/domain-rdap.json`.

## Sources

- [Cloudflare prices](https://pricing.registrar.cloudflare.com/)
- [Cloudflare at-cost Registrar](https://domains.cloudflare.com/)
- [IANA RDAP bootstrap](https://data.iana.org/rdap/dns.json)
- [IANA .me WHOIS delegation](https://www.iana.org/domains/root/db/me.html)
- [Cloudflare purchasing and tunnel walkthrough](CLOUDFLARE.md)
