# spiderfoot-ng

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python Version](https://img.shields.io/badge/python-3.10+-green)](https://www.python.org)
[![Last Commit](https://img.shields.io/github/last-commit/sammothxc/spiderfoot-ng)](https://github.com/sammothxc/spiderfoot-ng/commits/master)
[![CodeQL](https://github.com/sammothxc/spiderfoot-ng/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/sammothxc/spiderfoot-ng/actions/workflows/codeql-analysis.yml)
[![Tests](https://github.com/sammothxc/spiderfoot-ng/actions/workflows/tests.yaml/badge.svg)](https://github.com/sammothxc/spiderfoot-ng/actions/workflows/tests.yaml)
[![Docker](https://github.com/sammothxc/spiderfoot-ng/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/sammothxc/spiderfoot-ng/actions/workflows/docker-publish.yml)

**spiderfoot-ng** is an open-source intelligence (OSINT) automation tool. It integrates with hundreds of data sources and combines them with analysis modules to make the resulting data easy to navigate.

It has an embedded web server with a clean, intuitive web UI, and can also be driven entirely from the command line. It's written in Python 3 and MIT-licensed.

### [Jump to Installing and Running](#installing-and-running)

> **About this fork**
> spiderfoot-ng is a fork of [smicallef/spiderfoot](https://github.com/smicallef/spiderfoot), focused on keeping the project alive with up-to-date dependencies and modern container delivery. It deliberately ships a single slim Docker image rather than the bundled "full" image, see [A note on the Docker image](#a-note-on-the-docker-image) below. Parts of this fork were built with the help of AI. AI wrote a fair share of the code, and I read all of it. If something breaks, blame AI. If it works, blame AI.

## What's New in spiderfoot-ng

Improvements this fork adds on top of upstream SpiderFoot:

- Redesigned New Scan page: a reactive tri-column view (Profiles · Required Data · Modules) that shows exactly which modules will run and what data they'll collect *before* you start. Selecting a profile or the data you care about checks the right modules live, with inline flags for modules that are invasive, slow, or need an API key. Built-in profiles are starting templates you can fine-tune freely.
- Saved custom scan profiles: save any module selection as a named profile and reuse it, listed right alongside the built-in ones.
- Modern interactive network graph: a live-updating, colour-coded force graph (Cytoscape) that streams in new nodes as a scan runs. Click to highlight a node's connections and copy its value; filter or hide whole event types; hidden connectors stay greyed so the structure is preserved.
- Scan timing: a live elapsed/duration timer on the scan view, plus a sortable Duration column on the scan list.
- Modernized stack: tested on Python 3.10–3.14 with updated dependencies, and ships as a single slim Docker image (no bundled "full" image upsell, also no marketing footer).

## Features

- Web-based UI or CLI
- Over 200 modules (see the [modules table](#modules--integrations) below)
- YAML-configurable [correlation engine](/correlations/README.md) with [37 pre-defined rules](/correlations)
- CSV / JSON / GEXF export
- API key export/import
- SQLite back-end for custom querying
- Highly configurable
- TOR integration for dark web searching
- Can call other CLI tools like DNSTwist, WhatWeb, Nmap, and CMSeeK if installed on the host

## A Note on the Docker Image

spiderfoot-ng ships a single slim image (`ghcr.io/sammothxc/spiderfoot-ng:latest`). The original SpiderFoot project shipped a separate "full" image bundling Nuclei, WhatWeb, dnstwist, CMSeeK, TruffleHog and other third-party CLI tools — we don't. The maintenance burden of tracking ~12 unrelated upstream projects was disproportionate to the benefit, and most users only use a small subset of the OSINT modules.

If you need those tools, install them on your host (or in sidecar containers) and configure their binary paths in the SpiderFoot UI under each module's settings. The `archived/full-image` git tag preserves the last working configuration if you want to adapt it.

## Uses

spiderfoot-ng can be used offensively (e.g. in a red team exercise or penetration test) for reconnaissance of a target, or defensively to gather information about what your organisation might have exposed on the Internet.

Scan targets can include:

 - IP address
 - Domain/sub-domain name
 - Hostname
 - Network subnet (CIDR)
 - ASN
 - E-mail address
 - Phone number
 - Username
 - Person's name
 - Bitcoin address
 
The 200+ modules feed each other in a publisher/subscriber model to do things like:

- [Host / sub-domain / TLD enumeration](https://asciinema.org/a/295912)
- [Email address, phone number, and human name extraction](https://asciinema.org/a/295947)
- [Bitcoin and Ethereum address extraction](https://asciinema.org/a/295957)
- [Sub-domain hijacking susceptibility checks](https://asciinema.org/a/344377)
- DNS zone transfers
- [Threat intelligence and blacklist queries](https://asciinema.org/a/295949)
- API integration with [SHODAN](https://asciinema.org/a/127601), [HaveIBeenPwned](https://asciinema.org/a/128731), [GreyNoise](https://asciinema.org/a/295943), AlienVault, SecurityTrails, etc.
- [Social media account enumeration](https://asciinema.org/a/295923)
- [S3 / Azure / DigitalOcean bucket enumeration](https://asciinema.org/a/295941)
- IP geo-location
- Web scraping and content analysis
- [Image, document, and binary metadata analysis](https://asciinema.org/a/296274)
- Dark web searches
- [Port scanning and banner grabbing](https://asciinema.org/a/295939)
- [Data breach searches](https://asciinema.org/a/296145)

## Installing and Running

### Docker (recommended)

```sh
docker run -p 5001:5001 -v ./data:/var/lib/spiderfoot ghcr.io/sammothxc/spiderfoot-ng:latest
```

Then open `http://localhost:5001`.

For Docker Compose, Dockge, and other stack managers:

```yaml
services:
  spiderfoot:
    image: ghcr.io/sammothxc/spiderfoot-ng:latest
    container_name: spiderfoot
    ports:
      - "5001:5001"
    volumes:
      - ./data:/var/lib/spiderfoot
    restart: unless-stopped
```

If `./data` is owned by your host user, you may need to `chown -R 1000:1000 ./data` so the container's `spiderfoot` user can write to it.

### From source

```sh
git clone https://github.com/sammothxc/spiderfoot-ng.git
cd spiderfoot-ng
pip3 install -r requirements.txt
python3 ./sf.py -l 127.0.0.1:5001
```

Requires Python 3.10 or newer.

## Security

By default the web UI has no authentication; anyone who can reach the
host/port can run scans and read results. 

To require a login, enable HTTP authentication any of these ways:

- Environment variable (recommended for Docker): set `SPIDERFOOT_PASSWORD`
  (and optionally `SPIDERFOOT_USER`, default `admin`).

  ```sh
  docker run -p 5001:5001 -e SPIDERFOOT_USER=admin -e SPIDERFOOT_PASSWORD=changeme \
    -v ./data:/var/lib/spiderfoot ghcr.io/sammothxc/spiderfoot-ng:latest
  ```

- Command line: `--pass <password>` (and optionally `--user <username>`).
  Prefer the env var where possible, a CLI password can be visible in the
  process list.

- Password file: create `~/.spiderfoot/passwd` with one or more
  `username:password` lines (supports multiple users).

## Releasing

The version number lives in `spiderfoot/__version__.py` (canonical) and is mirrored
to the `VERSION` file. Both are updated automatically — never edit them by hand.

To cut a release, run one command (installs with `pip install -r test/requirements.txt`):

```sh
bump-my-version bump patch   # bug fixes:        4.0.2 -> 4.0.3
bump-my-version bump minor   # new features:     4.0.2 -> 4.1.0
bump-my-version bump major   # breaking changes: 4.0.2 -> 5.0.0
```

This updates the version files, commits, and creates a `vX.Y.Z` git tag. Push the
tag (`git push --follow-tags`) to trigger the Docker image publish workflow.

## Writing Correlation Rules

There's a comprehensive write-up of the correlation rule-set [here](/correlations/README.md).

Also take a look at the [template.yaml](/correlations/template.yaml) file for a walk-through. The existing [37 rules](/correlations) are quite readable and good as starting points.

## Modules and Integrations

spiderfoot-ng has over 200 modules, most of which *don't require API keys*, and many of those that do have a free tier.

### Free APIs

| Name | Description |
|:-----|:------------|
[abuse.ch](https://www.abuse.ch)|Check if a host/domain, IP address or netblock is malicious according to Abuse.ch.
[AdGuard DNS](https://adguard.com/)|Check if a host would be blocked by AdGuard DNS.
[Ahmia](https://ahmia.fi/)|Search Tor 'Ahmia' search engine for mentions of the target.
[AlienVault IP Reputation](https://cybersecurity.att.com/)|Check if an IP or netblock is malicious according to the AlienVault IP Reputation database.
[Amazon S3 Bucket Finder](https://aws.amazon.com/s3/)|Search for potential Amazon S3 buckets associated with the target and attempt to list their contents.
[Apple iTunes](https://itunes.apple.com/)|Search Apple iTunes for mobile apps.
[Archive.org](https://archive.org/)|Identifies historic versions of interesting files/pages from the Wayback Machine.
[ARIN](https://www.arin.net/)|Queries ARIN registry for contact information.
[Azure Blob Finder](https://azure.microsoft.com/en-in/services/storage/blobs/)|Search for potential Azure blobs associated with the target and attempt to list their contents.
[BGPView](https://bgpview.io/)|Obtain network information from BGPView API.
[BitcoinAbuse](https://www.bitcoinabuse.com/)|Check Bitcoin addresses against the bitcoinabuse.com database of suspect/malicious addresses.
[Blockchain](https://www.blockchain.com/)|Queries blockchain.info to find the balance of identified bitcoin wallet addresses.
[blocklist.de](http://www.blocklist.de/en/index.html)|Check if a netblock or IP is malicious according to blocklist.de.
[botvrij.eu](https://botvrij.eu/)|Check if a domain is malicious according to botvrij.eu.
[CallerName](http://callername.com/)|Lookup US phone number location and reputation information.
[Certificate Transparency](https://crt.sh/)|Gather hostnames from historical certificates in crt.sh.
[CINS Army List](https://cinsscore.com/)|Check if a netblock or IP address is malicious according to Collective Intelligence Network Security (CINS) Army list.
[CIRCL.LU](https://www.circl.lu/)|Obtain information from CIRCL.LU's Passive DNS and Passive SSL databases.
[CleanBrowsing.org](https://cleanbrowsing.org/)|Check if a host would be blocked by CleanBrowsing.org DNS content filters.
[CleanTalk Spam List](https://cleantalk.org)|Check if a netblock or IP address is on CleanTalk.org's spam IP list.
[CloudFlare DNS](https://www.cloudflare.com/)|Check if a host would be blocked by CloudFlare DNS.
[CoinBlocker Lists](https://zerodot1.gitlab.io/CoinBlockerListsWeb/)|Check if a domain appears on CoinBlocker lists.
[CommonCrawl](http://commoncrawl.org/)|Searches for URLs found through CommonCrawl.org.
[Crobat API](https://sonar.omnisint.io/)|Search Crobat API for subdomains.
[CRXcavator](https://crxcavator.io/)|Search CRXcavator for Chrome extensions.
[CyberCrime-Tracker.net](https://cybercrime-tracker.net/)|Check if a host/domain or IP address is malicious according to CyberCrime-Tracker.net.
[Debounce](https://debounce.io/)|Check whether an email is disposable
[Digital Ocean Space Finder](https://www.digitalocean.com/products/spaces/)|Search for potential Digital Ocean Spaces associated with the target and attempt to list their contents.
[DNS for Family](https://dnsforfamily.com/)|Check if a host would be blocked by DNS for Family.
[DNSDumpster](https://dnsdumpster.com/)|Passive subdomain enumeration using HackerTarget's DNSDumpster
[DNSGrep](https://opendata.rapid7.com/)|Obtain Passive DNS information from Rapid7 Sonar Project using DNSGrep API.
[DroneBL](https://dronebl.org/)|Query the DroneBL database for open relays, open proxies, vulnerable servers, etc.
[DuckDuckGo](https://duckduckgo.com/)|Query DuckDuckGo's API for descriptive information about your target.
[EmailFormat](https://www.email-format.com/)|Look up e-mail addresses on email-format.com.
[Emerging Threats](https://rules.emergingthreats.net/)|Check if a netblock or IP address is malicious according to EmergingThreats.net.
[Etherscan](https://etherscan.io)|Queries etherscan.io to find the balance of identified ethereum wallet addresses.
[Flickr](https://www.flickr.com/)|Search Flickr for domains, URLs and emails related to the specified domain.
[FortiGuard Antispam](https://www.fortiguard.com/)|Check if an IP address is malicious according to FortiGuard Antispam.
[Github](https://github.com/)|Identify associated public code repositories on Github.
[Google Object Storage Finder](https://cloud.google.com/storage)|Search for potential Google Object Storage buckets associated with the target and attempt to list their contents.
[Google SafeBrowsing](https://developers.google.com/safe-browsing/v4/lookup-api)|Check if the URL is included on any of the Safe Browsing lists.
[Gravatar](https://secure.gravatar.com/)|Retrieve user information from Gravatar API.
[Greensnow](https://greensnow.co/)|Check if a netblock or IP address is malicious according to greensnow.co.
[grep.app](https://grep.app/)|Search grep.app API for links and emails related to the specified domain.
[HackerOne (Unofficial)](http://www.nobbd.de/)|Check external vulnerability scanning/reporting service h1.nobbd.de to see if the target is listed.
[HackerTarget](https://hackertarget.com/)|Search HackerTarget.com for hosts sharing the same IP.
[Hybrid Analysis](https://www.hybrid-analysis.com)|Search Hybrid Analysis for domains and URLs related to the target.
[Internet Storm Center](https://isc.sans.edu)|Check if an IP address is malicious according to SANS ISC.
[Keybase](https://keybase.io/)|Obtain additional information about domain names and identified usernames.
[Leak-Lookup](https://leak-lookup.com/)|Searches Leak-Lookup.com's database of breaches.
[LeakIX](https://leakix.net/)|Search LeakIX for host data leaks, open ports, software and geoip.
[Maltiverse](https://maltiverse.com)|Obtain information about any malicious activities involving IP addresses
[Mnemonic PassiveDNS](https://www.mnemonic.no)|Obtain Passive DNS information from PassiveDNS.mnemonic.no.
[multiproxy.org Open Proxies](https://multiproxy.org/)|Check if an IP address is an open proxy according to multiproxy.org open proxy list.
[MySpace](https://myspace.com/)|Gather username and location from MySpace.com profiles.
[Onion.link](https://onion.link/)|Search Tor 'Onion City' search engine for mentions of the target domain using Google Custom Search.
[Onionsearchengine.com](https://as.onionsearchengine.com)|Search Tor onionsearchengine.com for mentions of the target domain.
[Open Bug Bounty](https://www.openbugbounty.org/)|Check external vulnerability scanning/reporting service openbugbounty.org to see if the target is listed.
[OpenDNS](https://www.opendns.com/)|Check if a host would be blocked by OpenDNS.
[OpenNIC DNS](https://www.opennic.org/)|Resolves host names in the OpenNIC alternative DNS system.
[OpenPhish](https://openphish.com/)|Check if a host/domain is malicious according to OpenPhish.com.
[OpenStreetMap](https://www.openstreetmap.org/)|Retrieves latitude/longitude coordinates for physical addresses from OpenStreetMap API.
[PhishStats](https://phishstats.info/)|Check if a netblock or IP address is malicious according to PhishStats.
[PhishTank](https://phishtank.com/)|Check if a host/domain is malicious according to PhishTank.
[Project Honey Pot](https://www.projecthoneypot.org/)|Query the Project Honey Pot database for IP addresses.
[Psbdmp](https://psbdmp.cc/)|Check psbdmp.cc (PasteBin Dump) for potentially hacked e-mails and domains.
[PunkSpider](https://punkspider.io/)|Check the QOMPLX punkspider.io service to see if the target is listed as vulnerable.
[Quad9](https://quad9.net/)|Check if a host would be blocked by Quad9 DNS.
[ReverseWhois](https://www.reversewhois.io/)|Reverse Whois lookups using reversewhois.io.
[RIPE](https://www.ripe.net/)|Queries the RIPE registry (includes ARIN data) to identify netblocks and other info.
[Robtex](https://www.robtex.com/)|Search Robtex.com for hosts sharing the same IP.
[searchcode](https://searchcode.com/)|Search searchcode for code repositories mentioning the target domain.
[Skymem](http://www.skymem.info/)|Look up e-mail addresses on Skymem.
[SlideShare](https://www.slideshare.net)|Gather name and location from SlideShare profiles.
[SORBS](http://www.sorbs.net/)|Query the SORBS database for open relays, open proxies, vulnerable servers, etc.
[SpamCop](https://www.spamcop.net/)|Check if a netblock or IP address is in the SpamCop database.
[Spamhaus Zen](https://www.spamhaus.org/)|Check if a netblock or IP address is in the Spamhaus Zen database.
[Steven Black Hosts](https://github.com/StevenBlack/hosts)|Check if a domain is malicious (malware or adware) according to Steven Black Hosts list.
[Sublist3r PassiveDNS](https://api.sublist3r.com)|Passive subdomain enumeration using Sublist3r's API
[SURBL](http://www.surbl.org/)|Check if a netblock, IP address or domain is in the SURBL blacklist.
[Talos Intelligence](https://talosintelligence.com/)|Check if a netblock or IP address is malicious according to TalosIntelligence.
[ThreatCrowd](https://www.threatcrowd.org)|Obtain information from ThreatCrowd about identified IP addresses, domains and e-mail addresses.
[ThreatFox](https://threatfox.abuse.ch)|Check if an IP address is malicious according to ThreatFox.
[ThreatMiner](https://www.threatminer.org/)|Obtain information from ThreatMiner's database for passive DNS and threat intelligence.
[TOR Exit Nodes](https://metrics.torproject.org/)|Check if an IP adddress or netblock appears on the Tor Metrics exit node list.
[TORCH](https://torchsearch.wordpress.com/)|Search Tor 'TORCH' search engine for mentions of the target domain.
[Trumail](https://trumail.io/)|Check whether an email is disposable
[Twitter](https://twitter.com/)|Gather name and location from Twitter profiles.
[UCEPROTECT](http://www.uceprotect.net/)|Check if a netblock or IP address is in the UCEPROTECT database.
[URLScan.io](https://urlscan.io/)|Search URLScan.io cache for domain information.
[Venmo](https://venmo.com/)|Gather user information from Venmo API.
[VoIP Blacklist (VoIPBL)](https://voipbl.org/)|Check if an IP address or netblock is malicious according to VoIP Blacklist (VoIPBL).
[VXVault.net](http://vxvault.net/)|Check if a domain or IP address is malicious according to VXVault.net.
[WiGLE](https://wigle.net/)|Query WiGLE to identify nearby WiFi access points.
[Wikileaks](https://wikileaks.org/)|Search Wikileaks for mentions of domain names and e-mail addresses.
[Wikipedia Edits](https://www.wikipedia.org/)|Identify edits to Wikipedia articles made from a given IP address or username.
[Yandex DNS](https://yandex.com/)|Check if a host would be blocked by Yandex DNS.
[Zone-H Defacement Check](https://zone-h.org/)|Check if a hostname/domain appears on the zone-h.org 'special defacements' RSS feed.

### Tiered APIs (free tier + paid plans)

| Name | Description |
|:-----|:------------|
[AbstractAPI](https://app.abstractapi.com/)|Look up domain, phone and IP address information from AbstractAPI.
[AbuseIPDB](https://www.abuseipdb.com)|Check if an IP address is malicious according to AbuseIPDB.com blacklist.
[Abusix Mail Intelligence](https://abusix.org/)|Check if a netblock or IP address is in the Abusix Mail Intelligence blacklist.
[AdBlock Check](https://adblockplus.org/)|Check if linked pages would be blocked by AdBlock Plus.
[AlienVault OTX](https://otx.alienvault.com/)|Obtain information from AlienVault Open Threat Exchange (OTX)
[BinaryEdge](https://www.binaryedge.io/)|Obtain information from BinaryEdge.io Internet scanning systems, including breaches, vulnerabilities, torrents and passive DNS.
[Bing](https://www.bing.com/)|Obtain information from bing to identify sub-domains and links.
[Bing (Shared IPs)](https://www.bing.com/)|Search Bing for hosts sharing the same IP.
[Bitcoin Who's Who](https://bitcoinwhoswho.com/)|Check for Bitcoin addresses against the Bitcoin Who's Who database of suspect/malicious addresses.
[BotScout](https://botscout.com/)|Searches BotScout.com's database of spam-bot IP addresses and e-mail addresses.
[BuiltWith](https://builtwith.com/)|Query BuiltWith.com's Domain API for information about your target's web technology stack, e-mail addresses and more.
[Censys](https://censys.io/)|Obtain host information from Censys.io.
[CertSpotter](https://sslmate.com/certspotter/)|Gather information about SSL certificates from SSLMate CertSpotter API.
[Clearbit](https://clearbit.com/)|Check for names, addresses, domains and more based on lookups of e-mail addresses on clearbit.com.
[Comodo Secure DNS](https://www.comodo.com/secure-dns/)|Check if a host would be blocked by Comodo Secure DNS.
[DNSDB](https://www.farsightsecurity.com)|Query FarSight's DNSDB for historical and passive DNS data.
[EmailCrawlr](https://emailcrawlr.com/)|Search EmailCrawlr for email addresses and phone numbers associated with a domain.
[EmailRep](https://emailrep.io/)|Search EmailRep.io for email address reputation.
[Focsec](https://focsec.com/)|Look up IP address information from Focsec.
[Fraudguard](https://fraudguard.io/)|Obtain threat information from Fraudguard.io
[FullContact](https://www.fullcontact.com)|Gather domain and e-mail information from FullContact.com API.
[FullHunt](https://fullhunt.io/)|Identify domain attack surface using FullHunt API.
[GLEIF](https://search.gleif.org/)|Look up company information from Global Legal Entity Identifier Foundation (GLEIF).
[Google](https://developers.google.com/custom-search)|Obtain information from the Google Custom Search API to identify sub-domains and links.
[Google Maps](https://cloud.google.com/maps-platform/)|Identifies potential physical addresses and latitude/longitude coordinates.
[Grayhat Warfare](https://buckets.grayhatwarfare.com/)|Find bucket names matching the keyword extracted from a domain from Grayhat API.
[GreyNoise](https://greynoise.io/)|Obtain IP enrichment data from GreyNoise
[GreyNoise Community](https://greynoise.io/)|Obtain IP enrichment data from GreyNoise Community API
[Host.io](https://host.io)|Obtain information about domain names from host.io.
[Hunter.io](https://hunter.io/)|Check for e-mail addresses and names on hunter.io.
[Iknowwhatyoudownload.com](https://iknowwhatyoudownload.com/en/peer/)|Check iknowwhatyoudownload.com for IP addresses that have been using torrents.
[IntelligenceX](https://intelx.io/)|Obtain information from IntelligenceX about identified IP addresses, domains, e-mail addresses and phone numbers.
[ipapi.co](https://ipapi.co/)|Queries ipapi.co to identify geolocation of IP Addresses using ipapi.co API
[ipapi.com](https://ipapi.com/)|Queries ipapi.com to identify geolocation of IP Addresses using ipapi.com API
[IPInfo.io](https://ipinfo.io)|Identifies the physical location of IP addresses identified using ipinfo.io.
[IPQualityScore](https://www.ipqualityscore.com/)|Determine if target is malicious using IPQualityScore API
[ipregistry](https://ipregistry.co/)|Query the ipregistry.co database for reputation and geo-location.
[ipstack](https://ipstack.com/)|Identifies the physical location of IP addresses identified using ipstack.com.
[JsonWHOIS.com](https://jsonwhois.com)|Search JsonWHOIS.com for WHOIS records associated with a domain.
[Koodous](https://koodous.com/apks/)|Search Koodous for mobile apps.
[MalwarePatrol](https://www.malwarepatrol.net/)|Searches malwarepatrol.net's database of malicious URLs/IPs.
[MetaDefender](https://metadefender.opswat.com/)|Search MetaDefender API for IP address and domain IP reputation.
[NameAPI](https://www.nameapi.org/)|Check whether an email is disposable
[NetworksDB](https://networksdb.io/)|Search NetworksDB.io API for IP address and domain information.
[NeutrinoAPI](https://www.neutrinoapi.com/)|Search NeutrinoAPI for phone location information, IP address information, and host reputation.
[numverify](http://numverify.com/)|Lookup phone number location and carrier information from numverify.com.
[Onyphe](https://www.onyphe.io)|Check Onyphe data (threat list, geo-location, pastries, vulnerabilities)  about a given IP.
[OpenCorporates](https://opencorporates.com)|Look up company information from OpenCorporates.
[PasteBin](https://pastebin.com/)|PasteBin search (via Google Search API) to identify related content.
[Pulsedive](https://pulsedive.com/)|Obtain information from Pulsedive's API.
[RiskIQ](https://community.riskiq.com/)|Obtain information from RiskIQ's (formerly PassiveTotal) Passive DNS and Passive SSL databases.
[SecurityTrails](https://securitytrails.com/)|Obtain Passive DNS and other information from SecurityTrails
[SHODAN](https://www.shodan.io/)|Obtain information from SHODAN about identified IP addresses.
[Snov](https://snov.io/)|Gather available email IDs from identified domains
[Social Media Profile Finder](https://developers.google.com/custom-search)|Tries to discover the social media profiles for human names identified.
[SpyOnWeb](http://spyonweb.com/)|Search SpyOnWeb for hosts sharing the same IP address, Google Analytics code, or Google Adsense code.
[StackOverflow](https://www.stackexchange.com)|Search StackOverflow for any mentions of a target domain. Returns potentially related information.
[TextMagic](https://www.textmagic.com/)|Obtain phone number type from TextMagic API
[Threat Jammer](https://threatjammer.com)|Check if an IP address is malicious according to ThreatJammer.com
[Trashpanda](https://got-hacked.wtf)|Queries Trashpanda to gather intelligence about mentions of target in pastesites
[Twilio](https://www.twilio.com/)|Obtain information from Twilio about phone numbers. Ensure you have the Caller Name add-on installed in Twilio.
[ViewDNS.info](https://viewdns.info/)|Identify co-hosted websites and perform reverse Whois lookups using ViewDNS.info.
[VirusTotal](https://www.virustotal.com/)|Obtain information from VirusTotal about identified IP addresses.
[WhatCMS](https://whatcms.org/)|Check web technology using WhatCMS.org API.
[XForce Exchange](https://exchange.xforce.ibmcloud.com/)|Obtain IP reputation and passive DNS information from IBM X-Force Exchange.
[Zetalytics](https://zetalytics.com/)|Query the Zetalytics database for hosts on your target domain(s).
[ZoneFile.io](https://zonefiles.io)|Search ZoneFiles.io Domain query API for domain information.

### Commercial APIs (paid only)

| Name | Description |
|:-----|:------------|
[C99](https://api.c99.nl/)|Queries the C99 API which offers various data (geo location, proxy detection, phone lookup, etc).
[Dehashed](https://www.dehashed.com/)|Gather breach data from Dehashed API.
[F-Secure Riddler.io](https://riddler.io/)|Obtain network information from F-Secure Riddler.io API.
[HaveIBeenPwned](https://haveibeenpwned.com/)|Check HaveIBeenPwned.com for hacked e-mail addresses identified in breaches.
[ProjectDiscovery Chaos](https://chaos.projectdiscovery.io)|Search for hosts/subdomains using chaos.projectdiscovery.io
[Seon](https://seon.io/)|Queries seon.io to gather intelligence about IP Addresses, email addresses, and phone numbers
[Social Links](https://sociallinks.io/)|Queries SocialLinks.io to gather intelligence from social media platforms and dark web.
[spur.us](https://spur.us/)|Obtain information about any malicious activities involving IP addresses found
[Whoisology](https://whoisology.com/)|Reverse Whois lookups using Whoisology.com.
[Whoxy](https://www.whoxy.com/)|Reverse Whois lookups using Whoxy.com.

### Internal modules (no external service)

| Name | Description |
|:-----|:------------|
Account Finder|Look for possible associated accounts on over 500 social and other websites such as Instagram, Reddit, etc.
Base64 Decoder|Identify Base64-encoded strings in URLs, often revealing interesting hidden information.
Binary String Extractor|Attempt to identify strings in binary content.
Bitcoin Finder|Identify bitcoin addresses in scraped webpages.
Company Name Extractor|Identify company names in any obtained data.
Cookie Extractor|Extract Cookies from HTTP headers.
Country Name Extractor|Identify country names in any obtained data.
Credit Card Number Extractor|Identify Credit Card Numbers in any data
Cross-Referencer|Identify whether other domains are associated ('Affiliates') of the target by looking for links back to the target site(s).
Custom Threat Feed|Check if a host/domain, netblock, ASN or IP is malicious according to your custom feed.
DNS Brute-forcer|Attempts to identify hostnames through brute-forcing common names and iterations.
DNS Common SRV|Attempts to identify hostnames through brute-forcing common DNS SRV records.
DNS Look-aside|Attempt to reverse-resolve the IP addresses next to your target to see if they are related.
DNS Raw Records|Retrieves raw DNS records such as MX, TXT and others.
DNS Resolver|Resolves hosts and IP addresses identified, also extracted from raw content.
DNS Zone Transfer|Attempts to perform a full DNS zone transfer.
E-Mail Address Extractor|Identify e-mail addresses in any obtained data.
Error String Extractor|Identify common error messages in content like SQL errors, etc.
Ethereum Address Extractor|Identify ethereum addresses in scraped webpages.
File Metadata Extractor|Extracts meta data from documents and images.
Hash Extractor|Identify MD5 and SHA hashes in web content, files and more.
Hosting Provider Identifier|Find out if any IP addresses identified fall within known 3rd party hosting ranges, e.g. Amazon, Azure, etc.
Human Name Extractor|Attempt to identify human names in fetched content.
IBAN Number Extractor|Identify International Bank Account Numbers (IBANs) in any data.
Interesting File Finder|Identifies potential files of interest, e.g. office documents, zip files.
Junk File Finder|Looks for old/temporary and other similar files.
Page Information|Obtain information about web pages (do they take passwords, do they contain forms, etc.)
PGP Key Servers|Look up domains and e-mail addresses in PGP public key servers.
Phone Number Extractor|Identify phone numbers in scraped webpages.
Port Scanner - TCP|Scans for commonly open TCP ports on Internet-facing systems.
Similar Domain Finder|Search various sources to identify similar looking domain names, for instance squatted domains.
Social Network Identifier|Identify presence on social media networks such as LinkedIn, Twitter and others.
SSL Certificate Analyzer|Gather information about SSL certificates used by the target's HTTPS sites.
Strange Header Identifier|Obtain non-standard HTTP headers returned by web servers.
Subdomain Takeover Checker|Check if affiliated subdomains are vulnerable to takeover.
TLD Searcher|Search all Internet TLDs for domains with the same name as the target (this can be very slow.)
Web Analytics Extractor|Identify web analytics IDs in scraped webpages and DNS TXT records.
Web Framework Identifier|Identify the usage of popular web frameworks like jQuery, YUI and others.
Web Server Identifier|Obtain web server banners to identify versions of web servers being used.
Web Spider|Spidering of web-pages to extract content for searching.
Whois|Perform a WHOIS look-up on domain names and owned netblocks.

### External tool integrations

| Name | Description |
|:-----|:------------|
[Tool - CMSeeK](https://github.com/Tuhinshubhra/CMSeeK)|Identify what Content Management System (CMS) might be used.
[Tool - DNSTwist](https://github.com/elceef/dnstwist)|Identify bit-squatting, typo and other similar domains to the target using a local DNSTwist installation.
[Tool - nbtscan](http://www.unixwiz.net/tools/nbtscan.html)|Scans for open NETBIOS nameservers on your target's network.
[Tool - Nmap](https://nmap.org/)|Identify what Operating System might be used.
[Tool - Nuclei](https://nuclei.projectdiscovery.io/)|Fast and customisable vulnerability scanner.
[Tool - onesixtyone](https://github.com/trailofbits/onesixtyone)|Fast scanner to find publicly exposed SNMP services.
[Tool - Retire.js](http://retirejs.github.io/retire.js/)|Scanner detecting the use of JavaScript libraries with known vulnerabilities
[Tool - snallygaster](https://github.com/hannob/snallygaster)|Finds file leaks and other security problems on HTTP servers.
[Tool - testssl.sh](https://testssl.sh)|Identify various TLS/SSL weaknesses, including Heartbleed, CRIME and ROBOT.
[Tool - TruffleHog](https://github.com/trufflesecurity/truffleHog)|Searches through git repositories for high entropy strings and secrets, digging deep into commit history.
[Tool - WAFW00F](https://github.com/EnableSecurity/wafw00f)|Identify what web application firewall (WAF) is in use on the specified website.
[Tool - Wappalyzer](https://www.wappalyzer.com/)|Wappalyzer indentifies technologies on websites.
[Tool - WhatWeb](https://github.com/urbanadventurer/whatweb)|Identify what software is in use on the specified website.

## Contributing

Pull requests, issues, and module additions are welcome. If you're fixing a bug or modernizing a dependency, please include a brief explanation of the root cause in the PR description.

## License

MIT; see [LICENSE](LICENSE). spiderfoot-ng is a fork of [smicallef/spiderfoot](https://github.com/smicallef/spiderfoot); the original copyright is preserved per the MIT terms.

