# Oren's Morning Brief

- Name: Oren Charnoff
- Slack user ID (send TO): U07K7Q9UQCS
- Attio assignee ID: NOT IN ATTIO — skip tasks section, render "No Attio tasks — Oren is not in the workspace"
- Timezone: Asia/Jerusalem

## Calendar

Oren's calendar is NOT accessible via the Google Calendar MCP. Fetch via Bash curl only (WebFetch is blocked by Google on iCal URLs).

Run these two curl commands in parallel:

```bash
curl -sL -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  'https://calendar.google.com/calendar/ical/oren%40sticker.vc/public/basic.ics' \
  -o /tmp/oren-public.ics

curl -sL -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  'https://calendar.google.com/calendar/ical/oren%40sticker.vc/private-f0f8a666315f4fb4784790aef21d4260/basic.ics' \
  -o /tmp/oren-private.ics
```

Parse with same python3 approach as daniel.md. If both files are empty or curl fails, render "Calendar unavailable" and continue.

## Tasks

Oren is not a member of the Attio workspace. Render "No Attio tasks — Oren is not in the workspace" and continue.

## CRM Enrichment

For each calendar event with external attendees:
1. Extract company from title and attendee email domains.
2. Attio search-records on people by email, companies by name/domain.
3. Surface: name, title, last interaction, deal stage, note. Company: description, founders, stage.
4. Flag priority for hot leads/active deals/portfolio.
5. Skip @sticker.vc teammates (label Sticker VC internal). Skip personal contacts.

## Message format

Slack markdown DM to U07K7Q9UQCS:

*Morning Brief — [DayOfWeek] [Mon DD]* | [N] events · [M] tasks · [K] news

*Today's Schedule*
[events with CRM context, or unavailable note]

*Tasks*
No Attio tasks — Oren is not in the workspace.

*Consumer & VC News*
[shared news section passed from orchestrator]

_[N] events · largest free block: HH:MM-HH:MM_
