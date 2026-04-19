# Danny's Morning Brief

- Name: Danny Cohen
- Slack user ID (send TO): U07JUUN34SJ
- Attio assignee ID: e0a61320-fc82-4991-aa90-18d611fe4ad9
- Timezone: Asia/Jerusalem

## Calendar

Danny's Google Calendar is not accessible via the Google Calendar MCP. Fetch his calendar by downloading the iCal feeds using WebFetch or Bash curl:

Public calendar:
https://calendar.google.com/calendar/ical/daniel%40sticker.vc/public/basic.ics

Private calendar (includes all events):
https://calendar.google.com/calendar/ical/daniel%40sticker.vc/private-435ba875bb3efe5ccf0cdcdba8954a37/basic.ics

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

Call Attio list-tasks with assignee_workspace_member_id=e0a61320-fc82-4991-aa90-18d611fe4ad9 and is_completed=false.

## CRM Enrichment

Same as Ophere's brief: for each external attendee run Attio lookups on people and companies. Skip @sticker.vc teammates (Sticker VC internal). Skip personal contacts.

## Message format

Slack markdown DM to U07JUUN34SJ:

*Morning Brief — [DayOfWeek] [Mon DD]* | [N] events · [M] tasks · [K] news

*Today's Schedule*
[events with CRM context]

*Tasks* — [M] open, [X] overdue
[tasks grouped High/Medium/Normal, overdue first]

*Consumer & VC News*
[shared news section passed from orchestrator]

_[N] events · [M] tasks · largest free block: HH:MM-HH:MM_
