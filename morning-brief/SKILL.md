# Morning Brief - Team Orchestrator

Run the morning brief for all active team members in sequence. Timezone: Asia/Jerusalem (IDT, UTC+3). All messages are sent as Slack DMs.

## TOOL NAMES IN THIS ENVIRONMENT

Use these EXACT tool names — do not guess alternatives:
- Google Calendar list events: `mcp__Google_Calendar__list_events` (parameter: calendarId, startTime, endTime, timeZone)
- Attio list tasks: `mcp__Attio__list-tasks` (parameters: assignee_workspace_member_id, is_completed, limit)
- Attio search records: `mcp__Attio__search-records` (parameters: object, query)
- Slack send DM: `mcp__Slack__slack_send_message` (parameters: channel_id, message)
- Slack read channel: `mcp__Slack__slack_read_channel` (parameters: channel_id, oldest, limit)

If a tool call fails with "tool not found", try the alternate prefix `mcp__claude_ai_Google_Calendar__list_events`, `mcp__claude_ai_Attio__list-tasks`, `mcp__claude_ai_Slack__slack_send_message` etc.

## Step 1 - Fetch shared news (once, reused for all briefs)

Read Slack channel news-searcher (channel ID: C0AL5246RU1) for the last 48 hours. Extract all article URLs and snippets. Run WebFetch on each URL (rate-limit: 1s between calls to same domain).

Rank top 5 by: sector priority (Health=4, Consumer AI=3, Beauty=3, CPG=1) + recency (today=3, last 2d=2, last 7d=1) + deal-size bonus (>$100M:+2, >$500M:+3). Filter to last 7 days only.

Deduplication: run `cat sent_news.jsonl` via Bash from the repo root. Skip any story whose URL or normalized headline appears in the last 60 days. After ALL briefs are sent, append the 5 chosen stories to sent_news.jsonl via Bash.

Format each story:
  N. [icon] <URL|Headline> (Source)
  📅 Published: YYYY-MM-DD (N days ago)
  Funding: $XXM. Lead: investors. 1-2 sentence VC context.

Sector icons: 🏥 health · 🤖 consumer AI · 💄 beauty · 🍔 CPG/food · 📦 other consumer.

If news-searcher has no messages or call fails: use "News unavailable today" as the news section and continue.

## Step 2 - Run each person's brief in order

For each person below, read their config file and send their brief. Pass the news section from Step 1. If one person's brief fails, log the error and continue to the next.

1. Read morning-brief/ophere.md → send Ophere's brief to U08U536URLJ
2. Read morning-brief/daniel.md → send Danny's brief to U07JUUN34SJ
3. Read morning-brief/rachel.md → send Rachel's brief to U096KTUE24X
4. Read morning-brief/oren.md → send Oren's brief to U07K7Q9UQCS