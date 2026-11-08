# Design Notes

This fork turns SIMerald (a Notion-backed, self-hosted SIM card wall built on the Komari Emerald theme) into a Cloudflare Worker that reads Obsidian notes.

## Decisions

1. **Notes as the source of truth.** One Markdown note per card: YAML properties for the card, a table in the body for renewal records. Obsidian (with Bases for an overview table) is the editor; the site never writes back.
2. **R2 as the bridge, sync on demand.** Cloudflare cannot read iCloud, and git on iOS is unreliable, so the vault is mirrored to R2 by Remotely Save. The Worker reads R2 only when the owner presses "Sync notes"; there is no schedule.
3. **Snapshot in KV, date logic at read time.** A sync stores normalized cards (including the manual next-renewal override) in KV. Status and next renewal depend on "today", so `withToday()` recomputes them on every request in the configured timezone; nothing goes stale between syncs.
4. **Formulas in code.** What the Notion template computed (current expiry, status, next renewal, CNY amounts, totals, first purchase) lives in `worker/cards.ts`, following the same rules.
5. **Cloudflare Access instead of a home-made login.** It removes password hashing (too CPU-heavy for the Workers free plan's 10 ms limit), TOTP and recovery codes. The Worker still verifies the Access JWT itself, so a misconfigured Access application fails closed.
6. **Problems are reported, not fatal.** Notes without properties or a carrier are skipped; other problems (missing number, foreign currency without a rate, no expiry) are listed in the admin page and shown on the card's data-check field for the owner.

## Security

- Visitor responses are built by an explicit allowlist (`worker/view.ts`).
- Public card IDs are an HMAC of the note path with a per-site key, so URLs reveal nothing about file names.
- Logos are served only from the logos folder, by file name without path separators; SVGs get a sandboxing CSP.
- Static pages carry security headers from `public/_headers`; API responses set their own.

## Out of scope

- Renewal reminders and notifications.
- Editing cards from the website.
