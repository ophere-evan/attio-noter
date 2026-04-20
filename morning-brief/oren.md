# Oren's Morning Brief

- Name: Oren Charnoff
- Slack user ID (send TO): U07K7Q9UQCS
- Attio assignee ID: NOT IN ATTIO — skip tasks section, render "No Attio tasks — Oren is not in the workspace"
- Timezone: Asia/Jerusalem

## Calendar

Oren has shared his calendar with ophere@sticker.vc. Use the Google Calendar MCP directly:

Call list_events with calendarId=oren@sticker.vc for today 00:00–23:59 Asia/Jerusalem.

If that fails, render "Calendar unavailable" and continue.

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

Slack markdown DM to U07K7Q9UQCS. Add a blank line between EVERY individual item.

*Morning Brief — [DayOfWeek] [Mon DD]* | [N] events · [M] tasks · [K] news

―――
*Today's Schedule*

[event 1 with CRM context]

[event 2 ...]

―――
*Tasks*

No Attio tasks — Oren is not in the workspace.

―――
*Consumer & VC News*

[news story 1]

[news story 2]

―――
_[N] events · largest free block: HH:MM-HH:MM_