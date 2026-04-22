# Oren's Morning Brief

- Name: Oren Charnoff
- Slack user ID (send TO): U07K7Q9UQCS
- Attio assignee ID: 32e14a57-bf26-4fd3-b11a-9ab9005d88b8
- Timezone: Asia/Jerusalem

## Calendar

Oren has shared his calendar with ophere@sticker.vc. Use the Google Calendar MCP directly:

Call list_events with calendarId=oren@sticker.vc for today 00:00–23:59 Asia/Jerusalem.

If that fails, render "Calendar unavailable" and continue.

## Tasks

Call Attio list-tasks with assignee_workspace_member_id=32e14a57-bf26-4fd3-b11a-9ab9005d88b8 and is_completed=false.

Group by priority (High / Medium / Normal), overdue first with days overdue. Show due date, task content, linked record.

## CRM Enrichment

For each calendar event with external attendees:
1. Extract company from title and attendee email domains.
2. Attio search-records on people by email, companies by name/domain.
3. Surface: name, title, last interaction, deal stage, note. Company: description, founders, stage.
4. Flag priority for hot leads/active deals/portfolio.
5. Skip @sticker.vc teammates (label Sticker VC internal). Skip personal contacts.

## Message format

Slack markdown DM to U07K7Q9UQCS. Add a blank line between EVERY individual item (between events, between tasks, between news stories) so nothing runs together.

*Morning Brief — [DayOfWeek] [Mon DD]* | [N] events · [M] tasks · [K] news

―――
*📅 Today's Schedule*

[event 1 with CRM context]

[event 2 with CRM context]

[event 3 ...]

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