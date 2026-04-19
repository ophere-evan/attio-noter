# Danny's Morning Brief

- Name: Danny Cohen
- Slack user ID (send TO): U07JUUN34SJ
- Attio assignee ID: e0a61320-fc82-4991-aa90-18d611fe4ad9
- Timezone: Asia/Jerusalem

## Calendar

Danny's calendar is NOT accessible via the Google Calendar MCP. Fetch via Bash curl only (WebFetch is blocked by Google on iCal URLs).

Run these two curl commands in parallel:

```bash
curl -sL -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  'https://calendar.google.com/calendar/ical/daniel%40sticker.vc/public/basic.ics' \
  -o /tmp/danny-public.ics

curl -sL -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  'https://calendar.google.com/calendar/ical/daniel%40sticker.vc/private-435ba875bb3efe5ccf0cdcdba8954a37/basic.ics' \
  -o /tmp/danny-private.ics
```

Then parse both files with python3 to extract today's events (Asia/Jerusalem date). Dedupe across both files (same SUMMARY + DTSTART = keep private copy). Sort by start time.

Python3 parsing script:
```python
import re, sys
from datetime import datetime, timezone, timedelta

IDT = timezone(timedelta(hours=3))
today_str = datetime.now(IDT).strftime('%Y%m%d')

def parse_ics(path):
    try:
        content = open(path).read()
    except:
        return []
    events = []
    for block in content.split('BEGIN:VEVENT')[1:]:
        end = block.find('END:VEVENT')
        block = block[:end] if end != -1 else block
        def get(field):
            m = re.search(r'(?:' + field + r')[^:]*:([^\r\n]+)', block)
            return m.group(1).strip() if m else ''
        start = get('DTSTART')
        if not start.startswith(today_str) and today_str not in start:
            continue
        events.append({
            'summary': get('SUMMARY'),
            'start': start,
            'end': get('DTEND'),
            'location': get('LOCATION'),
            'description': get('DESCRIPTION'),
            'attendees': re.findall(r'ATTENDEE[^:]*:mailto:([^\r\n]+)', block)
        })
    return events

pub = parse_ics('/tmp/danny-public.ics')
priv = parse_ics('/tmp/danny-private.ics')
# merge: prefer private copy on same title+start
priv_keys = {(e['summary'], e['start']) for e in priv}
merged = priv + [e for e in pub if (e['summary'], e['start']) not in priv_keys]
merged.sort(key=lambda e: e['start'])
for e in merged:
    print(e)
```

If both files are empty or curl fails, render "Calendar unavailable" and continue.

## Tasks

Call Attio list-tasks with assignee_workspace_member_id=e0a61320-fc82-4991-aa90-18d611fe4ad9 and is_completed=false.

Group by priority (High / Medium / Normal), overdue first with days overdue. Show due date, task content, linked record.

## CRM Enrichment

For each calendar event with external attendees:
1. Extract company from title and attendee email domains.
2. Attio search-records on people by email, companies by name/domain.
3. Surface: name, title, last interaction, deal stage, note. Company: description, founders, stage.
4. Flag priority for hot leads/active deals/portfolio.
5. Skip @sticker.vc teammates (label Sticker VC internal). Skip personal contacts.

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
