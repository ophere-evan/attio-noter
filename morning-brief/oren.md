# Oren's Morning Brief

- Name: Oren Charnoff
- Slack user ID (send TO): U07K7Q9UQCS
- Attio assignee ID: NOT IN ATTIO — skip tasks section, render "No Attio tasks — Oren is not in the workspace"
- Timezone: Asia/Jerusalem

## Calendar

Oren's Google Calendar is not accessible via the Google Calendar MCP. Fetch his calendar by downloading the iCal feeds using WebFetch or Bash curl:

Public calendar:
https://calendar.google.com/calendar/ical/oren%40sticker.vc/public/basic.ics

Private calendar (includes all events):
https://calendar.google.com/calendar/ical/oren%40sticker.vc/private-f0f8a666315f4fb4784790aef21d4260/basic.ics

Fetch BOTH URLs. Parse the .ics content using python3 to extract today's VEVENT blocks. Filter to events where DTSTART is today (Asia/Jerusalem date). For each event extract: SUMMARY (title), DTSTART, DTEND, LOCATION, DESCRIPTION, ATTENDEE fields. Dedupe across both feeds (same SUMMARY + DTSTART = keep private copy). Sort by start time.

Python3 ics parsing approach:
```
import sys, re
from datetime import datetime, timezone, timedelta
IDT = timezone(timedelta(hours=3))
today = datetime.now(IDT).date()
content = open(sys.argv[1]).read()
events = content.split('BEGIN:VEVENT')[1:]
for e in events:
    start = re.search(r'DTSTART[^:]*:([\d T]+)', e)
    summary = re.search(r'SUMMARY:(.*)', e)
    # filter to today and print
```

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
