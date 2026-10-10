# Choose a domain for your archive

By Erik Adler.

A domain is the name viewers type to reach your gallery. You can use an existing domain or register one with Cloudflare. Availability and prices change, so use [Cloudflare Registrar](https://dash.cloudflare.com/?to=/:account/registrar/register) for the definitive registration and renewal quote and [its price list](https://pricing.registrar.cloudflare.com/) for standard extension rates. Check renewal cost as well as promotional first-year pricing.

Buying a domain does not connect your local application automatically. Follow [Cloudflare setup](CLOUDFLARE.md) to create a named tunnel and route your chosen hostname to `http://localhost:3000`. The beginner guide also walks through this step.

For preliminary registry research, supply your own candidates:

```bash
python3 scripts/check-domains.py yourchosenname.com yourchosenname.page
```

The script uses IANA-discovered RDAP endpoints and the .me registry's WHOIS service when needed. A missing registration record does not establish that a name is registrable or has standard pricing. Reserved/premium names and taxes can differ. Status results are written under ignored `work/cloudflare/`; registrant contact details are not saved.

## Keep shared links usable

A direct media or presentation URL includes your hostname. Use a stable domain before sending lasting links; a Quick Tunnel hostname can change when restarted. Changing your domain does not rewrite links already sent in messages. Preserve the old hostname with a route/redirect if you need existing links to remain usable, and back up `.runtime/shared-links/` along with your database and uploads. [Sharing guide](SHARING.md).
