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

## Tools

### gong_list_calls
List calls within a date range with optional filtering:
* Search by date/time range
* Optional limit on number of results
* Returns call metadata, participants, and duration
* Example: "List all calls from July 1st to July 31st, 2022"

### gong_get_call
Get detailed information about a specific call:
* Retrieve call by unique ID
* Full call metadata and participant information
* Recording URLs and call status
* Example: "Get details for call ID 2167868958109749118"

### gong_get_transcript
Get call transcripts for analysis:
* Retrieve transcripts for one or more calls
* Speaker identification and timing
* Optional metadata inclusion
* Example: "Get transcript for call ID 379333695432645797"

### gong_list_users
List all users in the Gong organization:
* Active and inactive user management
* Optional result limiting
* User role and department information
* Example: "List all active users in the organization"

### gong_get_user
Get detailed information about a specific user:
* User profile and contact details
* Department and manager relationships
* Active status information
* Example: "Get details for user ID 1587172352477568464"

### gong_get_activity_aggregate
Get aggregate activity statistics:
* Total calls, duration, and averages
* Breakdown by call types and directions
* Per-user statistics
* Example: "Get activity stats from January 1st to July 13th, 2025"

### gong_get_activity_aggregate_by_period
Get activity statistics aggregated by time periods:
* Daily, weekly, monthly, quarterly, or yearly views
* Period-by-period breakdown
* Filtered by users, call types, and directions
* Example: "Get monthly activity stats from January to September 2022"

### gong_get_activity_day_by_day
Get detailed daily activity statistics:
* Day-by-day breakdown with metrics
* Call type distribution per day
* Weekend inclusion options
* Example: "Get daily activity stats for Q1 2022"

### gong_get_activity_scorecards
Generate performance scorecards:
* Performance metrics and scoring
* Insights and recommendations
* Customizable metric inclusion
* Example: "Generate monthly scorecards for the sales team"

### gong_get_interaction_stats
Analyze interaction patterns:
* Interaction type analysis
* Participant behavior patterns
* Optional transcript snippets
* Example: "Analyze interaction patterns for the last quarter"

## Setup

### Gong Authentication
You need to set up your Gong API credentials:

1. Get your Gong Access Key and Access Key Secret from your Gong account
2. Set environment variables for authentication

### Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

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
"Generate a scorecard for user 1587172352477568464"
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