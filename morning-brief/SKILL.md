# Morning Brief — Team Orchestrator

Run the morning brief for all active team members in sequence. Timezone: Asia/Jerusalem (IDT, UTC+3). All messages are sent as Slack DMs from this session (authenticated as Ophere Evan).

## Step 1 — Fetch shared news (once, reused for all briefs)

Read Slack channel #news-searcher (channel ID: C0AL5246RU1) for the last 48 hours. Extract all article URLs and snippets. Run WebFetch on each URL (rate-limit: 1s between calls to same domain). Rank top 5 by sector priority (Health=4, Consumer AI=3, Beauty=3, CPG=1) + recency (today=3, last 2d=2, last 7d=1) + deal-size bonus (>$100M:+2, >$500M:+3). Filter to last 7 days only.

Deduplication: read sent_news.jsonl in repo root. Skip URLs or normalized headlines seen in last 60 days. After ALL briefs are sent, append the 5 chosen stories once.

Format each story as Slack markdown:
  N. [icon] <URL|Headline> (Source)
  Published: YYYY-MM-DD (N days ago)
  Funding: $XXM. Lead: investors. 1-2 sentence VC context.

Sector icons: health, consumer AI, beauty, CPG, other consumer.

## Step 2 — Run each person's brief

Read and execute each of these files in order, passing the assembled news section so it is not re-fetched. A failure in one brief should not stop the others.

1. morning-brief/ophere.md
2. morning-brief/daniel.md
3. morning-brief/rachel.md

<!-- DISABLED: morning-brief/oren.md — Oren not yet on Attio, re-enable once he signs up -->
