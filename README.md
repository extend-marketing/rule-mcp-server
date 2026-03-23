# Rule MCP Server

A Model Context Protocol (MCP) server for the [Rule](https://rule.io) marketing automation platform. The server provides full access to Rule's REST API v2 for subscriber management, campaigns, transactional messages, and much more.

## Features

- **Subscriber Management**: Create, update, search and manage subscribers with custom fields
- **Tag & Segment Management**: Organize subscribers with tags and segments
- **Campaign Operations**: Create, send, schedule and analyze email/SMS campaigns
- **Transactional Messages**: Send individual emails and SMS
- **Template Management**: Access and use email templates
- **Custom Fields**: Define and manage subscriber data structures
- **Preferences**: Manage subscriber communication preferences
- **Journeys**: Access automation journey information
- **Suppressions**: Monitor bounces, spam complaints, and unsubscribes

## Prerequisites

- A Rule account at [app.rule.io](https://app.rule.io)
- Rule API key (Settings -> Developer -> New API key)

## Installation

### Option 1: Railway (Recommended for remote/team use)

Deploy the server to Railway so it's accessible as a remote MCP endpoint.

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/rule-mcp)

1. Click the "Deploy on Railway" button above
2. Sign in to [Railway](https://railway.app) (or create an account)
3. Click **Deploy** — Railway will build and start the server automatically
4. Once deployed, go to your service's **Settings -> Networking** and generate a public domain (e.g. `rule-mcp-server-production.up.railway.app`)
5. Your MCP endpoint is now available at: `https://<your-domain>/mcp`
6. Each user connects with their own Rule API key in the `Authorization` header (see below)

#### Connecting to the Railway-hosted server

Each user provides their own Rule API key via the `Authorization` header. No API key is stored on the server.

**Claude Desktop** (remote MCP server):

Add to your `claude_desktop_config.json`:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "rule": {
      "type": "streamable-http",
      "url": "https://your-app.up.railway.app/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_RULE_API_KEY"
      }
    }
  }
}
```

**Claude Code** (CLI):

```bash
claude mcp add rule --transport streamable-http --header "Authorization: Bearer YOUR_RULE_API_KEY" https://your-app.up.railway.app/mcp
```

**Cursor / other MCP clients:**

Use the Streamable HTTP transport with the URL `https://your-app.up.railway.app/mcp` and set the header `Authorization: Bearer YOUR_RULE_API_KEY`.

#### Railway environment variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | Auto | Set automatically by Railway |

#### Health check

The server exposes a `GET /health` endpoint that returns `{"status":"ok"}`. You can use this to verify the deployment is running.

### Option 2: Local installation (stdio)

Run the server locally for direct use with Claude Desktop or other MCP clients.

```bash
git clone https://github.com/extend-marketing/rule-mcp-server.git
cd rule-mcp-server
npm install
```

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "rule": {
      "command": "node",
      "args": ["/absolute/path/to/rule-mcp-server/index.js"],
      "env": {
        "RULE_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Restart Claude Desktop after saving the config.

### Getting Your API Key

1. Log in to [app.rule.io](https://app.rule.io)
2. Go to **Settings -> Developer**
3. Click **New API key**
4. Copy and save your API key securely

## Available Tools

### Subscriber Management

#### `rule_create_subscribers`
Create one or multiple subscribers with support for:
- Custom fields (text, date, datetime, multiple, json)
- Tag assignment (auto-creates tags)
- Automation trigger control
- Opt-in flow integration
- Update on duplicate

**Example:**
```javascript
{
  "subscribers": {
    "email": "[email protected]",
    "phone_number": "+46701234567",
    "language": "sv",
    "fields": [
      {
        "key": "Profile.FirstName",
        "value": "Anna",
        "type": "text"
      },
      {
        "key": "Purchase.LastOrderDate",
        "value": "2024-03-20 12:00:00",
        "type": "datetime"
      }
    ]
  },
  "tags": ["Newsletter", "Customer"],
  "update_on_duplicate": true,
  "automation": "reset"
}
```

#### `rule_get_subscribers`
List all subscribers with pagination (max 100 per page).

#### `rule_get_subscriber`
Get detailed subscriber information by email, phone, or ID.

#### `rule_get_subscriber_fields`
Get all custom field values for a subscriber organized by groups.

#### `rule_update_subscriber`
Update subscriber details including email, phone, language, tags, and custom fields.

#### `rule_delete_subscriber`
Permanently remove a subscriber.

### Tag Management

#### `rule_add_subscriber_tags`
Add tags to a subscriber (creates tags if they don't exist, triggers automations).

#### `rule_get_subscriber_tags`
List all tags for a subscriber.

#### `rule_clear_subscriber_tags`
Remove all tags from a subscriber (doesn't delete tags).

#### `rule_delete_subscriber_tag`
Remove a specific tag from a subscriber.

#### `rule_get_tags`
List all tags with pagination.

#### `rule_get_tag`
Get tag details with optional subscriber count.

#### `rule_update_tag`
Update tag name or description.

#### `rule_delete_tag`
Permanently delete a tag.

#### `rule_clear_tag`
Remove all subscribers from a tag.

### Segments

#### `rule_get_segments`
List all sync-at segments with pagination.

### Transactions (Individual Messages)

#### `rule_send_transaction`
Send individual transactional email or SMS.

**Email Example:**
```javascript
{
  "transaction_type": "email",
  "transaction_name": "Password Reset",
  "subject": "Reset Your Password",
  "from": {
    "name": "My Company",
    "email": "[email protected]"
  },
  "to": {
    "name": "John Doe",
    "email": "[email protected]"
  },
  "content": {
    "plain": "UGFzc3dvcmQgcmVzZXQ=",  // Base64 encoded
    "html": "PHA+UGFzc3dvcmQgcmVzZXQ8L3A+"  // Base64 encoded
  }
}
```

**SMS Example (0.40 SEK per message):**
```javascript
{
  "transaction_type": "text_message",
  "from": {
    "name": "My Company"
  },
  "to": {
    "phone_number": "+46701234567"
  },
  "content": "Your verification code is: 123456"
}
```

### Templates

#### `rule_get_templates`
List all available email templates.

#### `rule_get_template`
Get template details including supported content blocks.

### Campaigns

#### `rule_get_campaigns`
List campaigns with optional filtering:
- Type (1=email, 2=SMS)
- Creation date range
- Send date range

#### `rule_create_campaign`
Create a draft campaign with recipients and content.

#### `rule_get_campaign`
Get campaign details including recipients.

#### `rule_get_campaign_statistics`
Get campaign performance metrics:
- Sends, opens, clicks
- Bounces (hard/soft)
- Unsubscribes

#### `rule_send_campaign`
Send a campaign immediately.

#### `rule_schedule_campaign`
Schedule campaign for future delivery.

**Example:**
```javascript
{
  "send_at": "2024-12-25 10:00:00",
  "subject": "Holiday Greetings",
  "message_type": "email",
  "language": "sv",
  "from": {
    "name": "My Company",
    "email": "[email protected]"
  },
  "recipients": {
    "tags": [
      { "identifier": "Newsletter" }
    ],
    "segments": [
      { "identifier": "InactiveUsers", "negative": true }
    ]
  },
  "content": {
    "plain": "...",
    "html": "..."
  }
}
```

#### `rule_delete_campaign`
Permanently delete a campaign.

### Custom Fields

#### `rule_create_groups_and_fields`
Create custom field groups and fields.

**Example:**
```javascript
{
  "fields": [
    {
      "key": "Profile.FirstName",
      "type": "text"
    },
    {
      "key": "Orders.LastPurchase",
      "type": "datetime"
    },
    {
      "key": "Preferences.Categories",
      "type": "multiple"
    }
  ]
}
```

**Supported field types:**
- `text` - Text strings
- `date` - Dates (YYYY-MM-DD)
- `datetime` - Timestamps (YYYY-MM-DD HH:MM:SS)
- `time` - Time values (HH:MM:SS)
- `multiple` - Arrays of strings
- `json` - JSON-encoded data

#### `rule_get_groups`
List all custom field groups with their fields.

#### `rule_get_group`
Get a specific group's fields.

### Suppressions

#### `rule_get_suppressions`
List all suppressions (bounces, spam complaints, unsubscribes).

### Preferences

#### `rule_get_preference_groups`
List all preference groups with available preferences.

#### `rule_get_subscriber_preferences`
Get a subscriber's preferences for a specific group.

#### `rule_update_subscriber_preferences`
Update subscriber's opt-in/opt-out status.

**Example:**
```javascript
{
  "identifier": "[email protected]",
  "preference_group_id": 1,
  "preferences": [
    {
      "preference_id": 1,
      "is_opted_in": true
    },
    {
      "preference_id": 2,
      "is_opted_in": false
    }
  ]
}
```

### Journeys

#### `rule_get_journeys`
List automation journeys with optional filtering by name or preference.

## Common Use Cases

### 1. Add Subscriber with Custom Data
```javascript
// Create subscriber with profile data and order history
{
  "subscribers": {
    "email": "[email protected]",
    "fields": [
      { "key": "Profile.FirstName", "value": "Erik", "type": "text" },
      { "key": "Orders.LastOrder", "value": "2024-03-20", "type": "date" },
      { "key": "Orders.TotalSpent", "value": "2500", "type": "text" }
    ]
  },
  "tags": ["Customer", "HighValue"],
  "update_on_duplicate": true
}
```

### 2. Send Transactional Email
```javascript
// Send order confirmation
{
  "transaction_type": "email",
  "transaction_name": "Order Confirmation",
  "subject": "Your Order #12345",
  "from": {
    "name": "My Shop",
    "email": "[email protected]"
  },
  "to": {
    "name": "Customer Name",
    "email": "[email protected]"
  },
  "content": {
    "plain": btoa("Thank you for your order!"),
    "html": btoa("<h1>Thank you!</h1><p>Your order is confirmed.</p>")
  }
}
```

### 3. Create and Send Campaign
```javascript
// Create campaign
const campaign = await rule_create_campaign({
  "subject": "Spring Sale - 30% Off",
  "message_type": "email",
  "from": { "name": "My Shop", "email": "[email protected]" },
  "recipients": {
    "tags": [{ "identifier": "Newsletter" }]
  },
  "content": { "plain": "...", "html": "..." }
});

// Send immediately
await rule_send_campaign(campaign);
```

### 4. Manage Subscriber Tags
```javascript
// Add tags
await rule_add_subscriber_tags({
  "identifier": "[email protected]",
  "tags": ["VIP", "Spring2024Campaign"]
});

// Remove specific tag
await rule_delete_subscriber_tag({
  "identifier": "[email protected]",
  "tag_identifier": "Spring2024Campaign"
});
```

### 5. Bulk Import with Automation
```javascript
// Import subscribers and trigger welcome flow
{
  "subscribers": [
    { "email": "[email protected]", "fields": [...] },
    { "email": "[email protected]", "fields": [...] }
  ],
  "tags": ["Newsletter"],
  "automation": "force",  // Trigger automation flows
  "sync_subscribers": true
}
```

## API Limits & Best Practices

### Rate Limits
- **Default**: 2000 requests per 10 minutes
- **Error rate**: Max 49% error responses
- If exceeded, wait for the time specified in `Retry-After` header

### Pagination
- **Max limit**: 100 items per request
- Use the `meta.next` URL from responses for next page
- Available on: subscribers, tags, segments, campaigns, suppressions

### Field Data Size
- **Max per group**: 65,000 characters (65 KB)
- This is the sum of all field values within one group

### Bulk Operations
- **Max subscribers per call**: 1000
- **Async behavior**: Automatic for large batches
- **Automation limit**: Max 100 subscribers when `sync_subscribers: true`

### Content Encoding
- **Email content**: Must be Base64 encoded (plain and HTML)
- **SMS**: Plain text, no encoding required
- **SMS cost**: 0.40 SEK per message

### Authentication
The API key can be provided in three ways (this server uses Bearer token):
1. Header: `Authorization: Bearer YOUR-API-KEY`
2. Query param: `?apikey=YOUR-API-KEY`
3. Request body: `"apikey": "YOUR-API-KEY"`

## Error Handling

Common error responses:

```javascript
// 401 - Not authorized
{ "error": "NotAuthorized" }

// 404 - Resource not found
{ "error": "SubscriberNotFound", "message": "Could not find subscriber" }

// 400 - Validation error
{
  "error": "BadRequest",
  "message": "Some fields could not be validated",
  "fields": {
    "email": ["The email field is required"]
  }
}

// 409 - Duplicate
{ "error": "DuplicateSubscriber", "message": "Subscriber already exists" }

// 429 - Rate limit exceeded
"Too Many Attempts."
```

## Integration Examples

### Shopify Order → Rule Subscriber
```javascript
// When order is created in Shopify
async function syncOrderToRule(order) {
  await rule_create_subscribers({
    subscribers: {
      email: order.customer.email,
      fields: [
        { key: "Orders.LastOrder", value: order.created_at, type: "datetime" },
        { key: "Orders.LastAmount", value: order.total_price, type: "text" },
        { key: "Orders.ProductNames", value: order.line_items.map(i => i.title), type: "multiple" }
      ]
    },
    tags: ["Customer", `Order${order.order_number}`],
    update_on_duplicate: true
  });
}
```

### Abandoned Cart Recovery
```javascript
// Trigger cart abandonment flow
async function handleAbandonedCart(cart) {
  await rule_create_subscribers({
    subscribers: {
      email: cart.email,
      fields: [
        { key: "Cart.AbandonedAt", value: new Date().toISOString(), type: "datetime" },
        { key: "Cart.Items", value: JSON.stringify(cart.items), type: "json" }
      ]
    },
    tags: ["AbandonedCart"],
    automation: "reset",  // Restart abandoned cart flow
    update_on_duplicate: true
  });
}
```

### Post-Purchase Follow-up
```javascript
// Schedule follow-up campaign
async function scheduleFollowUp(purchaseData) {
  const followUpDate = new Date();
  followUpDate.setDate(followUpDate.getDate() + 7);

  await rule_schedule_campaign({
    send_at: followUpDate.toISOString().slice(0, 19).replace('T', ' '),
    subject: "How are you enjoying your purchase?",
    message_type: "email",
    from: { name: "My Shop", email: "[email protected]" },
    recipients: {
      tags: [{ identifier: `Order${purchaseData.orderId}` }]
    },
    content: {
      plain: btoa("..."),
      html: btoa("...")
    }
  });
}
```

## Webhooks

Rule can send webhooks for various events. Configure at: https://app.rule.io/#/settings/developer

**Available webhook events:**
- Transaction sent/opened/clicked
- Campaign sent/opened/clicked
- Subscriber opted in/suppressed/added to tag/bounced
- Import finished
- Preference updated

**Example webhook payload (transaction sent):**
```javascript
{
  "message": {
    "id": 111111,
    "transaction_id": 111111,
    "subject": "Password Reset",
    "type": "email",
    "created_at": "2024-03-20 12:00:00"
  },
  "subscriber": {
    "id": 111111,
    "email": "[email protected]",
    "phone_number": "+46701234567"
  }
}
```

## Resources

- **API Documentation**: https://apidoc.rule.se/
- **V3 API Docs**: https://app.rule.io/redoc/v3
- **Help Center**: https://help.rule.io/
- **Postman Collection**: Available at https://apidoc.rule.se/
- **Node.js SDK**: https://github.com/rulecom/rule-sdk-node

## License

MIT

## Support

For issues with the MCP server, please create an issue in the repository.

For Rule API questions, contact: [email protected]
