#!/bin/bash
# Run this locally to send The Sticker Weekly

# Set MC_API_KEY to your Mailchimp API key before running
MC_AUTH="anystring:${MC_API_KEY:?MC_API_KEY env var is required}"
HTML_FILE="sticker_weekly_2026-06-01.html"

echo "Step 1: Creating campaign..."
CAMPAIGN=$(curl -s --user "$MC_AUTH" \
  -X POST "https://us3.api.mailchimp.com/3.0/campaigns" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "regular",
    "recipients": {
      "list_id": "7ef1713807",
      "segment_opts": {"saved_segment_id": 10086471}
    },
    "settings": {
      "subject_line": "The Sticker Weekly — Week of June 1, 2026",
      "preview_text": "The dominant story this week is a tale of two DTCs: Everlane sold to Shein for $100M, while Being Frenshe cleared $250M in sales without VC. Agentic commerce goes live at Sephora, Ulta, and Olly.",
      "title": "The Sticker Weekly — 2026-06-01",
      "from_name": "Sticker Ventures",
      "reply_to": "ophere@sticker.vc"
    }
  }')

CAMPAIGN_ID=$(echo "$CAMPAIGN" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "Campaign ID: $CAMPAIGN_ID"

echo "Step 2: Setting HTML content..."
HTML_CONTENT=$(cat "$HTML_FILE")
curl -s --user "$MC_AUTH" \
  -X PUT "https://us3.api.mailchimp.com/3.0/campaigns/$CAMPAIGN_ID/content" \
  -H "Content-Type: application/json" \
  -d "{\"html\": $(python3 -c "import sys,json; print(json.dumps(open('$HTML_FILE').read()))")}"

echo "Step 3: Sending campaign..."
curl -s --user "$MC_AUTH" \
  -X POST "https://us3.api.mailchimp.com/3.0/campaigns/$CAMPAIGN_ID/actions/send"

echo "Step 4: Verifying..."
VERIFY=$(curl -s --user "$MC_AUTH" \
  "https://us3.api.mailchimp.com/3.0/campaigns/$CAMPAIGN_ID")
STATUS=$(echo "$VERIFY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','unknown'))")
EMAILS=$(echo "$VERIFY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('emails_sent','?'))")
echo "Status: $STATUS | Emails sent: $EMAILS"
