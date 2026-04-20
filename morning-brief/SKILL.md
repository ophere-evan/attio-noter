# Morning Brief - Team Orchestrator

Run the morning brief for all active team members in sequence. Timezone: Asia/Jerusalem (IDT, UTC+3). All messages are sent as Slack DMs.

IMPORTANT TOOL USAGE IN THIS ENVIRONMENT:
- Slack: use the slack_send_message tool (channel_id = the recipient's Slack user ID for DMs)
- Google Calendar: use the list_events tool with a calendarId parameter
- Attio: use the list-tasks tool and search-records tool
- Web: use WebFetch for fetching URLs
- File: use Bash to read/write files, use Read to read repo files

## Step 1 - Fetch shared news (once, reused for all briefs)

Read Slack channel news-searcher (channel ID: C0AL5246RU1) for the last 48 hours using slack_read_channel. Extract all article URLs and snippets. Run WebFetch on each URL (rate-limit: 1s between calls to same domain).

Rank top 5 by: sector priority (Health=4, Consumer AI=3, Beauty=3, CPG=1) + recency (today=3, last 2d=2, last 7d=1) + deal-size bonus (>$100M:+2, >$500M:+3). Filter to last 7 days only.

Deduplication: read the file sent_news.jsonl at the repo root using Bash (cat sent_news.jsonl). Skip any story whose URL or normalized headline appears in the last 60 days. After ALL briefs are sent, append the 5 chosen stories to sent_news.jsonl.

Format each story:
  N. [icon] <URL|Headline> (Source)
  Published: YYYY-MM-DD (N days ago)
  Funding: $XXM. Lead: investors. 1-2 sentence VC context.

Sector icons: health, consumer AI, beauty, CPG, other consumer.

If news-searcher has no messages: use "No news available today" as the news section and continue.

## Step 2 - Run each person's brief in order

For each person below, read their config file and send their brief. Pass the news section assembled above. If one person's brief fails, continue to the next.

1. Read morning-brief/ophere.md and send Ophere's brief
2. Read morning-brief/daniel.md and send Danny's brief
3. Read morning-brief/rachel.md and send Rachel's brief
4. Read morning-brief/oren.md and send Oren's brief