# Ophere's Morning Brief

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

Group by priority (High 🔴 / Medium 🟡 / Normal 🟢), overdue first (mark ⚠️ overdue · N days). Show due date, task content, linked record.

## CRM Enrichment

For each calendar event with external attendees:
1. Extract company from title and attendee email domains.
2. Attio search-records on people by email, companies by name/domain.
3. Surface: name, title, last interaction, deal stage, note. Company: description, founders, stage.
4. Flag 🔥 priority for hot leads/active deals/portfolio.
5. Skip @sticker.vc teammates (label Sticker VC internal). Skip personal contacts.

## Message format

Send as ONE single Slack message to U08U536URLJ. Do not split into multiple messages.

First line must be bold with pipe separator (not ·):
*Morning Brief — [DayOfWeek] [Mon DD] | [N] events · [M] tasks · [K] news*

Section headers use emojis exactly as shown below. Sector emoji goes inline before each news headline (💄 beauty · 🏥 health · 🤖 consumer AI · 🍔 CPG/food · 📦 other consumer).

News story format — no emoji on Published line:
  N. [sector-emoji] <URL|Headline> (Source)
  Published: YYYY-MM-DD (N days ago)
  Funding/context: 1-2 sentence VC context.

*Morning Brief — [DayOfWeek] [Mon DD] | [N] events · [M] tasks · [K] news*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Today's Schedule

[event 1 with CRM context]

[event 2 with CRM context]

[event 3 ...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Tasks — [M] open, [X] overdue

[task 1]

[task 2]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📰 Consumer & VC News

1. 💄 <URL|Headline> (Source)
   Published: YYYY-MM-DD
   Context.

2. 🏥 <URL|Headline> (Source)
   Published: YYYY-MM-DD
   Context.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_[N] events · [M] tasks · largest free block: HH:MM–HH:MM_