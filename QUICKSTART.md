# Quick Start Guide - Rule MCP Server

## Prerequisites
- A Rule account at https://app.rule.io
- Rule API key (get from Settings -> Developer)
- For local install: Node.js 18 or higher

## Option A: Deploy to Railway (Fastest)

1. Click the deploy button in the [README](README.md#option-1-railway-recommended-for-remoteteam-use)
2. Set your `RULE_API_KEY` environment variable
3. Generate a public domain in Railway (Settings -> Networking)
4. Add to Claude Desktop config:

```json
{
  "mcpServers": {
    "rule": {
      "type": "streamable-http",
      "url": "https://your-app.up.railway.app/mcp"
    }
  }
}
```

5. Restart Claude Desktop

## Option B: Local Installation

### 1. Install Dependencies
```bash
cd rule-mcp-server
npm install
```

### 2. Configure Claude Desktop

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "rule": {
      "command": "node",
      "args": ["/full/path/to/rule-mcp-server/index.js"],
      "env": {
        "RULE_API_KEY": "your-rule-api-key-here"
      }
    }
  }
}
```

### 3. Restart Claude Desktop

After saving the config file, restart Claude Desktop completely.

## Verify Installation

In Claude Desktop, try:
```
Can you list my Rule subscribers?
```

Claude should respond with subscriber data from your Rule account.

## First Tasks to Try

### 1. Check Your Tags
```
Show me all tags in my Rule account
```

### 2. Get Subscriber Count for a Tag
```
How many subscribers are in the "Newsletter" tag?
```

### 3. Create a Test Subscriber
```
Create a test subscriber in Rule:
- Email: [email protected]
- First name: Test
- Tag: TestSubscribers
```

### 4. View Campaign Statistics
```
Show me statistics for my recent campaigns
```

### 5. Check Segments
```
List all segments in my Rule account
```

## Common Issues

### "RULE_API_KEY environment variable is required"
- Make sure your API key is set in the config file
- Verify the path to index.js is correct
- Restart Claude Desktop after changes

### "Rule API Error: NotAuthorized"
- Check that your API key is correct
- Verify the API key is active in Rule
- Generate a new API key if needed

### "Cannot find module"
- Run `npm install` in the rule-mcp-server directory
- Make sure Node.js 18+ is installed

### Server not appearing in Claude
- Check JSON syntax in claude_desktop_config.json
- Verify the absolute path to index.js
- Look for errors in Claude Desktop logs

## Next Steps

Once working:
1. Review the full README.md for all available tools
2. Check the API documentation at https://apidoc.rule.se/
3. Explore webhook configurations for real-time integrations
4. Build automation workflows using Rule's journey builder

## Getting Help

- **MCP Server Issues**: Check the README.md or create an issue
- **Rule API Questions**: [email protected]
- **Rule Platform Help**: https://help.rule.io/
