# Rachel's Morning Brief

- Name: Rachel Lipschitz
- Slack user ID (send TO): U096KTUE24X
- Attio assignee ID: 1d4ee24f-5eff-4d5c-8aab-d1c4f9641245
- Timezone: Asia/Jerusalem

## Calendar

Rachel's calendar is NOT accessible via the Google Calendar MCP. Fetch via Bash curl only (WebFetch is blocked by Google on iCal URLs).

Run these two curl commands:

```bash
curl -sL -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  'https://calendar.google.com/calendar/ical/rachel%40sticker.vc/public/basic.ics' \
  -o /tmp/rachel-public.ics

curl -sL -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  'https://calendar.google.com/calendar/ical/rachel%40sticker.vc/private-0f7868439910bce1fff4e0af0c1a35ae/basic.ics' \
  -o /tmp/rachel-private.ics
```

Parse both files with python3 to extract today's VEVENT blocks (Asia/Jerusalem date). Dedupe across both feeds (same SUMMARY + DTSTART = keep private copy). Sort by start time.

Python3 parsing:
```python
import re
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
        if today_str not in start:
            continue
        events.append({
            'summary': get('SUMMARY'),
            'start': start,
            'end': get('DTEND'),
            'location': get('LOCATION'),
            'attendees': re.findall(r'ATTENDEE[^:]*:mailto:([^\r\n]+)', block)
        })
    return events

priv = parse_ics('/tmp/rachel-private.ics')
pub = parse_ics('/tmp/rachel-public.ics')
priv_keys = {(e['summary'], e['start']) for e in priv}
merged = priv + [e for e in pub if (e['summary'], e['start']) not in priv_keys]
merged.sort(key=lambda e: e['start'])
for e in merged:
    print(e)
```

If both files are empty or curl fails, render "Calendar unavailable" and continue.

## Tasks

Call Attio list-tasks with assignee_workspace_member_id=1d4ee24f-5eff-4d5c-8aab-d1c4f9641245 and is_completed=false.

Group by priority (High / Medium / Normal), overdue first with days overdue. Show due date, task content, linked record.

## CRM Enrichment

For each calendar event with external attendees:
1. Extract company from title and attendee email domains.
2. Attio search-records on people by email, companies by name/domain.
3. Surface: name, title, last interaction, deal stage, note. Company: description, founders, stage.
4. Flag priority for hot leads/active deals/portfolio.
5. Skip @sticker.vc teammates (label Sticker VC internal). Skip personal contacts.

## Message format

Slack markdown DM to U096KTUE24X. Add a blank line between EVERY individual item.

*Morning Brief — [DayOfWeek] [Mon DD]* | [N] events · [M] tasks · [K] news

―――
*📅 Today's Schedule*

[event 1 with CRM context]

[event 2 ...]

―――
*✅ Tasks* — [M] open, [X] overdue

[task 1]

[task 2]

―――
*📰 Consumer & VC News*

[news story 1]

[news story 2]

[news story 3 ...]

―――
_[N] events · [M] tasks · largest free block: HH:MM-HH:MM_
