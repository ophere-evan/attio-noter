# Rachel's Morning Brief

- Slack channel (send TO): C0AUNKRD16Z (rachels-morning-brief channel)
- Attio assignee ID: 1d4ee24f-5eff-4d5c-8aab-d1c4f9641245
- Timezone: Asia/Jerusalem

## Calendar

Rachel has shared her calendar with ophere@sticker.vc. Call list_events with calendarId=rachel@sticker.vc for today 00:00-23:59 Asia/Jerusalem. If that fails, render Calendar unavailable and continue.

## Tasks

Call Attio list-tasks with assignee_workspace_member_id=1d4ee24f-5eff-4d5c-8aab-d1c4f9641245 and is_completed=false.

Group by priority (High / Medium / Normal), overdue first (mark overdue N days). Show due date, task content, linked record.

## CRM Enrichment

For each calendar event with external attendees:
1. Extract company from title and attendee email domains.
2. Attio search-records on people by email, companies by name/domain.
3. Surface: name, title, last interaction, deal stage, note. Company: description, founders, stage.
4. Flag priority for hot leads/active deals/portfolio.
5. Skip @sticker.vc teammates (label Sticker VC internal). Skip personal contacts.

## Message format

Send as ONE single Slack message to C0AUNKRD16Z. Do not split into multiple messages.

First line bold: *Morning Brief — [DayOfWeek] [Mon DD] | [N] events · [M] tasks · [K] news*

Section headers use emojis. Sector emoji goes inline before each news headline.
Sector icons: beauty, health, consumer AI, CPG/food, other consumer.

News story format — one compact paragraph per story, no separate Funding line:
  N. [sector-emoji] Headline (Source)
  Published: YYYY-MM-DD (N days ago)
  One paragraph (2-3 sentences max): what happened, key numbers (raise/valuation/revenue), why it matters for a consumer VC. Keep concise to stay within Slack message limits.

*Morning Brief — [DayOfWeek] [Mon DD] | [N] events · [M] tasks · [K] news*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Today's Schedule

[event 1 with CRM context]

[event 2 with CRM context]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tasks — [M] open, [X] overdue

[task 1]

[task 2]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Consumer and VC News

1. [sector-emoji] Headline (Source)
   Published: YYYY-MM-DD (N days ago)
   One paragraph context.

2. [sector-emoji] Headline (Source)
   Published: YYYY-MM-DD (N days ago)
   One paragraph context.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_[N] events · [M] tasks · largest free block: HH:MM-HH:MM_