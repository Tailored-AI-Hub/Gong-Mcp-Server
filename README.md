# Gong MCP Server

An MCP (Model Context Protocol) server implementation that integrates Claude with Gong, enabling natural language interactions with your Gong call data and analytics. This server allows Claude to query, analyze, and generate insights from your sales conversations and team performance using everyday language.

## Features

* **Call Management**: List and retrieve detailed information about calls within date ranges
* **Transcript Analysis**: Get full call transcripts for content analysis and insights
* **User Management**: Access user information and team structure
* **Activity Analytics**: Generate comprehensive activity statistics and performance metrics
* **Period-based Analysis**: Analyze data by day, week, month, quarter, or year
* **Scorecard Generation**: Create performance scorecards with metrics and insights
* **Interaction Patterns**: Analyze call interaction patterns and behaviors
* **Flexible Filtering**: Filter data by users, call types, directions, and time periods

## Installation

```bash
npm install -g @tailoredai/gong-mcp-server
```

Or run on-demand without global install:

```bash
npx -y @tailoredai/gong-mcp-server
```

## Tools

### gong_list_calls
List recent calls. No inputs.
- Response: pagination summary (may be omitted) then entries like:
  - `Call ID`, `Title`, `Direction`, `Scheduled Time`, `Started Time`, `Duration`, `Call Purpose`, `Language`

### gong_get_call
Get a specific call by ID.
- Input: `{ "callId": "2167868958109749118" }`
- Response: one formatted call entry with the same fields as above

### gong_get_transcript
Get transcripts for one or more calls.
- Input: `{ "filter": { "callIds": ["379333695432645797", "2167868958109749118"] } }`
- Response: for each call:
  - `Transcript for Call ID: ...`
  - `Speaker ID: ...` lines
  - Sentences with timestamps like `[mm:ss - mm:ss] text`

### gong_list_users
List users with optional pagination.
- Optional inputs: `pageNumber`, `pageSize`, `cursor`, `includeInactive`
- Response: pagination summary then entries:
  - `User ID`, `Name`, `Email`, `Title`, `Manager ID`, `Active`

### gong_get_user
Get a specific user by ID.
- Input: `{ "userId": "1587172352477568464" }`
- Response: `User Details:` block with `ID`, `Name`, `Email`, `Title`, `Manager ID`, `Active`

### gong_get_activity_aggregate
Get user-level activity totals in a date range.
- Input: `{ "filter": { "fromDate": "YYYY-MM-DD", "toDate": "YYYY-MM-DD", "__userIds": [optional] } }`
- Response: header `Activity Statistics (from to)`, then `User Totals` blocks per user with fields like `callsAsHost`, `callsAttended`, feedback/listening/share stats

### gong_get_activity_scorecards
Fetch activity scorecards.
- Input: `{ "aggregationPeriod": "QUARTER", "filter": { "fromDate": "YYYY-MM-DD", "toDate": "YYYY-MM-DD", "__userIds": [optional] } }`
- Response: scorecard blocks with period, score, and `Answers:` list (question/score/overall)

### gong_get_interaction_stats
Per-person interaction metrics within a date range.
- Input: `{ "filter": { "fromDate": "YYYY-MM-DD", "toDate": "YYYY-MM-DD", "__userIds": [optional] } }`
- Response: for each person: `User ID`, `User Email`, then metric lines like `- Talk Ratio: 65`

## Setup

### Gong Authentication
You need to set up your Gong API credentials:

1. Get your Gong Access Key and Access Key Secret from your Gong account
2. Set environment variables for authentication

### Usage with Claude Desktop

Add to your `claude_desktop_config.json` (npx):

```json
{
  "mcpServers": {
    "gong": {
      "command": "npx",
      "args": ["-y", "@tailoredai/gong-mcp-server"],
      "env": {
        "GONG_ACCESS_KEY": "your_access_key",
        "GONG_ACCESS_KEY_SECRET": "your_access_key_secret",
        "GONG_BASE_URL": "https://api.gong.io/v2"
      }
    }
  }
}
```

Or using the globally installed binary (no npx):

```json
{
  "mcpServers": {
    "gong": {
      "command": "gong-connector",
      "env": {
        "GONG_ACCESS_KEY": "your_access_key",
        "GONG_ACCESS_KEY_SECRET": "your_access_key_secret",
        "GONG_BASE_URL": "https://api.gong.io/v2"
      }
    }
  }
}
```

## Example Usage

### Call Analysis
```
"List all calls from last month"
"Get transcript for the most recent sales call"
"Show me calls longer than 30 minutes from this week"
```

### User Performance
```
"Get activity stats for the sales team this quarter"
"Show me the top performers by call volume"
"Generate a scorecard for user 1234567890"
```

### Team Analytics
```
"Compare team performance by month for 2022"
"Analyze call patterns by department"
"Get daily activity breakdown for the last 30 days"
```

### Transcript Analysis
```
"Get transcripts for all calls with prospects this week"
"Analyze conversation patterns in discovery calls"
"Review call quality metrics for the team"
```
## Development

### Building from source
```bash
# Clone the repository
git clone https://github.com/Tailored-AI-Hub/Gong-Mcp-Server

# Navigate to directory
cd Gong-Mcp-Server

# Install dependencies
npm install

# Build the project
npm run build
```

### Environment Variables
- `GONG_ACCESS_KEY`: Your Gong API access key
- `GONG_ACCESS_KEY_SECRET`: Your Gong API access key secret
- `GONG_BASE_URL`: Gong Base URL (default: https://api.gong.io/v2)

## API Endpoints Covered

This MCP server covers the following Gong API endpoints:

- `GET /v2/calls` - List calls with date filtering
- `GET /v2/calls/{id}` - Get specific call details
- `POST /v2/calls/transcript` - Get call transcripts
- `GET /v2/users` - List organization users
- `GET /v2/users/{id}` - Get specific user details
- `POST /v2/stats/activity/aggregate` - Aggregate activity statistics
- `POST /v2/stats/activity/aggregate-by-period` - Period-based aggregation
- `POST /v2/stats/activity/day-by-day` - Daily activity breakdown
- `POST /v2/stats/activity/scorecards` - Performance scorecards
- `POST /v2/stats/interaction` - Interaction pattern analysis

## Contributing
Contributions are welcome! Please open an issue to discuss major changes and submit a PR.
1. Fork the repo and create a feature branch.
2. Run tests with `npm test` and ensure they pass.
3. Follow conventional commits if possible.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Issues and Support
If you encounter any issues or need support, please file an issue on the GitHub repository.