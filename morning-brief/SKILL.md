# Morning Brief Skill

Produce and send the daily morning brief for Ophere Evan (ophere@sticker.vc). Timezone: Asia/Jerusalem (IDT, UTC+3). Run all three sections independently - a failure in one produces an inline note, do not abort. If all three fail, do not send.

## Inputs

- Destination email: ophere@sticker.vc
- Timezone: Asia/Jerusalem (IDT, UTC+3)
- Today = current date at run time
- Priority sectors: 1) Health & Wellness 2) Consumer AI 3) Beauty & personal care 4) Food/CPG

---

## Section 1 - Calendar with CRM context

Call list_events for today 00:00-23:59 on BOTH calendars in parallel:
- ophere@sticker.vc (primary/work)
- ophere.evan@gmail.com (personal)

Merge results. Dedupe: same title + start time = keep sticker.vc copy. Sort by start time. Tag personal events [personal].

For each event:
1. Extract company name from meeting title (e.g. "Acme <> Sticker", "Acme | Ophere") and from attendee email domains.
2. Run Attio lookups in parallel across all events: search-records on people by each external attendee email; search-records on companies by extracted company name and attendee email domain.
3. Enrich: person name, title, last interaction date, deal stage, most recent note. Company: one-line description, founders (names + titles), stage, last interaction, deal stage.
4. Flag priority when Attio deal-stage indicates hot lead / active deal / existing portfolio.
5. Skip Attio for @sticker.vc teammates - show as "Sticker VC internal". Skip for personal gmail contacts.
6. Show location and video link when present.

Format each event:
```
HH:MM-HH:MM - <title> [location] [video link]
  With: <Name> - <Title> @ <Company> [priority flag]
  Company: <description> - Founders: <names>
  Context: <last interaction - deal stage - note>
```

---

## Section 2 - Tasks

Call Attio list-tasks with:
- assignee_workspace_member_id: 0f954f15-49fd-48e0-8fd1-a9ab9916ab96
- is_completed: false

Group by priority (High / Medium / Normal), highest first. Within each group show overdue tasks first (mark overdue with days count). Show due date, task content, linked record.

If call fails render "Tasks unavailable" and continue.

---

## Section 3 - News

Source: Slack channel #news-searcher (channel ID: C0AL5246RU1) ONLY. Do not web search.

Read the channel for the last 48 hours. Extract every article URL and snippet. Run WebFetch on each URL to get headline, source, publication date, funding amount, round type, lead investors. Rate-limit: at least 1 second between WebFetch calls to the same domain.

Ranking: score each item by sector priority (Health=4, Consumer AI=3, Beauty=3, CPG=1) + recency (today=3, last 2 days=2, last 7 days=1) + deal-size bonus (over $100M: +2, over $500M: +3). Hard filter: 7 days old max. Pick top 5.

Deduplication: check the file sent_news.jsonl in the repo root. Skip any story whose URL or normalized headline (lowercase, no punctuation, collapsed whitespace) appears in the last 60 days. After sending, append the 5 chosen stories as JSON lines: {date, url, domain, normalized_headline}.

If channel is empty or call fails render "News unavailable today" and continue.

Display format per story:
```
N. [sector icon] Headline (Source)
   Published: YYYY-MM-DD (N days ago)
Funding: $XXM. Lead: investors. 1-2 sentence context for a consumer VC.
URL
```
Sector icons: health, consumer AI, beauty, CPG, other consumer.

---

## Email Assembly

Subject: Morning Brief - [DayOfWeek] [Mon DD] - [N] events - [M] tasks - [K] news

Single HTML email, inline CSS only, max-width 640px:
1. Greeting line with date and timezone
2. Today's Schedule section
3. Tasks section  
4. Consumer & VC News section
5. Footer: total events, meeting hours, largest free block, open task count

Colors: High priority #d33, Medium #d4a017, Normal #2e7d32. Text #222, secondary #666.

---

## Send via Zapier

Do NOT use any Gmail MCP tools. Send using Bash only:

1. Write the complete HTML body to a temp file: HTML_FILE=$(mktemp /tmp/brief-XXXX.html) then write HTML to it.
2. Set SUBJECT variable to the subject line string.
3. Build JSON payload using python3:
   python3 -c "import json,sys; print(json.dumps({'subject':sys.argv[1],'html_body':open(sys.argv[2]).read()}))" "$SUBJECT" "$HTML_FILE" > /tmp/brief-payload.json
4. POST to Zapier webhook with retry:
   for i in 1 2 3; do
     STATUS=$(curl -s -o /tmp/brief-resp.txt -w '%{http_code}' -X POST 'https://hooks.zapier.com/hooks/catch/23499779/ujrwano/' -H 'Content-Type: application/json' --data-binary @/tmp/brief-payload.json)
     [ "$STATUS" -ge 200 ] && [ "$STATUS" -lt 300 ] && break
     sleep $i
   done
5. Clean up temp files.
6. If all retries fail: fall back to Gmail MCP create_draft and note the fallback.

---

## Output

After sending output:
- Subject line sent
- 3-bullet summary: next meeting, top task, top news headline
