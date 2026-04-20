# Rachel's Morning Brief

- Name: Rachel Lipschitz
- Slack user ID (send TO): U096KTUE24X
- Attio assignee ID: 1d4ee24f-5eff-4d5c-8aab-d1c4f9641245
- Timezone: Asia/Jerusalem

## Calendar

Rachel has shared her calendar with ophere@sticker.vc. Use the Google Calendar MCP directly:

Call list_events with calendarId=rachel@sticker.vc for today 00:00–23:59 Asia/Jerusalem.

If that fails, fall back to calendarId=rachel@sticker.vc using the primary calendar lookup. If all fail, render "Calendar unavailable" and continue.

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
