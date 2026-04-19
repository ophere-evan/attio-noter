# Ophere's Morning Brief

- Name: Ophere Evan
- Slack user ID (send TO): U08U536URLJ
- Attio assignee ID: 0f954f15-49fd-48e0-8fd1-a9ab9916ab96
- Timezone: Asia/Jerusalem

## Calendar

Fetch via Google Calendar MCP (list_events) for today 00:00-23:59 on both:
- ophere@sticker.vc (primary)
- ophere.evan@gmail.com (personal)

Merge, dedupe (same title+start = keep sticker.vc copy), sort by start. Tag personal events [personal].

## Tasks

Call Attio list-tasks with assignee_workspace_member_id=0f954f15-49fd-48e0-8fd1-a9ab9916ab96 and is_completed=false.

## CRM Enrichment

For each calendar event with external attendees:
1. Extract company from title and attendee email domains.
2. Attio search-records on people by email, companies by name/domain.
3. Surface: name, title, last interaction, deal stage, note. Company: description, founders, stage.
4. Flag priority for hot leads/active deals/portfolio.
5. Skip @sticker.vc teammates (label Sticker VC internal) and personal gmail contacts.

## Message format

Slack markdown DM to U08U536URLJ:

*Morning Brief — [DayOfWeek] [Mon DD]* | [N] events · [M] tasks · [K] news

*Today's Schedule*
[events with CRM context]

*Tasks* — [M] open, [X] overdue
[tasks grouped High/Medium/Normal, overdue first]

*Consumer & VC News*
[shared news section passed from orchestrator]

_[N] events · [M] tasks · largest free block: HH:MM-HH:MM_
