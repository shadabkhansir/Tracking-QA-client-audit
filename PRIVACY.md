# Privacy Policy: Pixel & Tag Checker by The Growth Folks®

_Last updated: 2026-10-15_

Pixel & Tag Checker ("the extension") is a Chrome extension published by The Growth Folks®. It checks the
analytics and advertising tags on websites you choose to audit. Everything it does happens inside your own browser.

## Summary

- The extension has **no server**, **no analytics**, **no ads** and **no third-party SDKs**.
- It **does not send any data** to The Growth Folks® or to anyone else.
- Audit data stays in your browser's extension storage until you delete it or remove the extension.

## What the extension reads

**Network requests (webRequest).** While the extension is installed, Chrome lets it see the URL (and, for POST
requests, the body) of requests made by your tabs. Each request is checked in memory against a fixed list of tracking
endpoints: Google Analytics 4 (including server-side Google Tag Manager endpoints on a site's own domain), Google Tag
Manager, the Google tag, Google Ads, Floodlight, Meta Pixel, TikTok Pixel, LinkedIn Insight Tag, Pinterest Tag, Snap
Pixel, X (Twitter) Pixel, Microsoft Advertising UET, Reddit Pixel, Microsoft Clarity and Hotjar, the same payloads sent
through a site's own domain (first-party proxies), and any custom endpoints you add in Settings. Requests that do not
match are discarded immediately and never stored. For matching requests the extension keeps the platform, tag ID,
event name, the request parameters, the request body (capped at 4,000 characters, for HAR export) and the HTTP status
and timing of the response, so you can inspect them and see whether each hit was accepted. The URL of each top-level page you navigate to is kept
as a marker so requests can be grouped by page.

**The page's tag setup.** On every http/https page, a small script records `dataLayer.push()` calls from the moment the
page starts loading, so the dataLayer tab can show them in order. When you run an audit, the extension also reads the
page's tag configuration: the dataLayer, Google's consent state, which Meta/TikTok pixel IDs are configured, which
consent-management platform is present, where the GTM and Meta snippets sit in the page, and the **names** (never the
values) of cookies set on the page.

**Cookies (cookies permission).** When you run an audit or scan, the extension lists the first-party cookies for the
audited page's URL with their name, domain, path, expiry and flags, so the report can show which vendors set cookies and
whether any were set before consent. Cookie **values are never read into results or stored**. No other site's cookies
are read.

**Shopify custom pixels.** On Shopify stores, the same dataLayer recorder also runs inside Shopify's custom-pixel sandbox
frames, and those frames report their own URL so requests from them can be labelled. When you use
"Use links from this page" it reads same-site link URLs from the page.

**Consent banner test.** Only when you choose "Accept all" or "Reject all" as a consent test does the extension click
that choice on the page's cookie banner (or call the consent platform's own API) so it can compare tag behaviour before
and after.

**Global Privacy Control test.** Only when you choose "GPC signal" as a consent test does the extension reload the page
once with the `Sec-GPC: 1` header (a temporary declarativeNetRequest rule limited to that tab) and
`navigator.globalPrivacyControl` set to true, then remove the rule. It changes nothing else about your requests.

## What it stores, and where

| Data | Where | How long |
|---|---|---|
| Live tracking requests and dataLayer pushes for each tab | `chrome.storage.session` (memory, never written to disk by Chrome) | Reset when the tab navigates (unless you turn on "Preserve log"), deleted when the tab closes, and gone when the browser quits |
| Saved audits: page URLs and titles, score, findings, tag IDs, event names, consent states, cookie names and metadata (no values) | `chrome.storage.local` on your device | Until you delete them in History. The Free plan keeps the last 5 (the planned Pro plan, 500) |
| Report notes and "Prepared for" text you type | `chrome.storage.local` | Stored with the audit |
| Report branding you enter (agency name, contact line, colour, logo, call-to-action link) | `chrome.storage.local` | Until you change it or remove the extension |
| Monitors you set up (URLs, schedule) and settings, including ID labels and custom providers | `chrome.storage.local` | Until you remove them |
| Audits you import from a JSON file | `chrome.storage.local` | Until you delete them in History |

**Personal data in tracking payloads.** Tracking requests and dataLayer pushes can contain personal data that the
audited website itself sends to its vendors (for example an email address a site leaks into a pixel). Those raw values
are only held in session storage for the live Requests and dataLayer tabs, and in any CSV/JSON/HAR file you choose to
export. Saved audits and client reports record only the **name** of the parameter that contained personal data, never
the value, and email addresses in saved page URLs are replaced with `[email]`. Other query-string parameters in page
URLs are kept as visited.

## What it sends

The extension sends no data to The Growth Folks® or anyone else and has no server to receive data. The only pages it loads are the ones you ask it to scan or monitor and, once after install, a welcome page. Reports, CSV, JSON and HAR
files are generated locally and only leave your computer if you choose to download, print or share them.

The extension opens links to thegrowthfolks.com (help, privacy, the welcome page after install, and an optional credit
link in reports). These links carry UTM parameters that say the click came from the extension and from which part of
the interface; they contain no audit data. Pages on thegrowthfolks.com are covered by that site's own privacy policy.

## Optional permissions and actions you trigger

- **Multi-page scans and monitoring** open the URLs you enter in background tabs and close them afterwards.
  Scheduled monitoring (planned Pro feature; it asks for the optional alarms and notifications permissions) re-runs those scans in the background on the schedule you set and shows a desktop
  notification when results change.
- **Fresh visitor mode** asks for the optional `browsingData` permission and, only for the sites you are scanning,
  deletes their cookies, local storage, IndexedDB and service workers before the scan (you will be logged out of
  those sites). The extension asks you to confirm first.

## Deleting your data

Delete individual audits in the History tab, remove monitors in the Monitor tab, or remove the extension from
`chrome://extensions` to erase everything it stored.

## Children

The extension is a professional tool for marketers and analysts and is not directed at children.

## Changes

If this policy changes, the new version will be published at https://thegrowthfolks.com/tools/tag-checker/privacy with
a new "Last updated" date.

## Contact

The Growth Folks® · team@thegrowthfolks.com
