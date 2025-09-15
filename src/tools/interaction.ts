import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { GongConnection } from "../utils/connection.js";
import { GongInteractionFilter, GongInteractionResponse } from "../types/gong.js";

export const GET_INTERACTION_STATS: Tool = {
  name: "gong_get_interaction_stats",
  description: `Get interaction statistics and patterns from call data.

Example:
{
  "filter": {
    "fromDate": "2025-01-01",
    "toDate": "2025-07-13",
    "__userIds": ["1587172352477568464"]
  }
}

Returns: Interaction events or per-person metrics depending on org settings. Includes call IDs, interaction types, timestamps, durations, participants, and optional summaries.

Notes:
- Dates must be YYYY-MM-DD.
- Output can be a flat interactions list or peopleInteractionStats with per-person aggregates.
- Narrow the date range for faster results.`,
  inputSchema: {
    type: "object",
    properties: {
        filter: {
            type: "object",
            properties: {
              fromDate: {
                type: "string",
                description: "Start date in YYYY-MM-DD format (e.g., 2022-01-01)"
              },
              toDate: {
                type: "string",
                description: "End date in YYYY-MM-DD format (e.g., 2022-09-13)"
              },
              __userIds: {
                type: "array",
                items: {
                  type: "string"
                },
                description: "Array of user IDs to filter by (optional)"
              }
            },
            required: ["fromDate", "toDate"]
          }
        },
    required: ["filter"]
  }
};

export interface GetInteractionStatsArgs {
  filter: {
    fromDate: string;
    toDate: string;
    __userIds?: string[];
  }
}

function extractCallId(interaction: any): string {
  return (
    interaction.callId ||
    interaction.call_id ||
    interaction.callID ||
    interaction.call?.id ||
    interaction.call?.callId ||
    interaction.event?.callId ||
    interaction.meta?.callId ||
    interaction.metadata?.callId ||
    'Unknown'
  );
}

function extractType(interaction: any): string {
  return (
    interaction.interactionType ||
    interaction.type ||
    interaction.eventType ||
    interaction.category ||
    interaction.kind ||
    'Unknown'
  );
}

function extractTimestamp(interaction: any): string {
  return (
    interaction.timestamp ||
    interaction.time ||
    interaction.occurredAt ||
    interaction.createdAt ||
    interaction.eventTime ||
    interaction.startedAt ||
    'Unknown'
  );
}

function extractDurationSeconds(interaction: any): number {
  const d = interaction.duration ?? interaction.durationSeconds ?? interaction.length ?? interaction.metrics?.duration;
  const n = Number(d);
  if (Number.isFinite(n) && n >= 0) return n;
  return 0;
}

function extractParticipants(interaction: any): string {
  const p = interaction.participants ?? interaction.participantNames ?? interaction.speakers ?? interaction.entities?.participants;
  if (!p) return 'Unknown';
  if (Array.isArray(p)) {
    // Could be array of strings or objects
    const names = p.map((x: any) => (typeof x === 'string' ? x : x?.name || x?.displayName || x?.email)).filter(Boolean);
    if (names.length > 0) return names.join(', ');
    return 'Unknown';
  }
  if (typeof p === 'string') return p;
  return 'Unknown';
}

export async function handleGetInteractionStats(conn: GongConnection, args: GetInteractionStatsArgs): Promise<{ content: string[] }> {
  try {
    // Validate required parameters
    if (!args.filter || !args.filter.fromDate || !args.filter.toDate) {
      throw new Error('fromDate and toDate are required');
    }

    const requestBody: GongInteractionFilter = {
      filter: args.filter
    };

    if (args.filter.__userIds && args.filter.__userIds.length > 0) {
      requestBody.filter.__userIds = args.filter.__userIds;
    }

    const interactionsResponse = await conn.post<any>('/stats/interaction', requestBody);
    
    // Special case: people-level interaction stats
    if (Array.isArray(interactionsResponse?.peopleInteractionStats)) {
      const people = interactionsResponse.peopleInteractionStats as Array<any>;
      const content = [
        `Interaction Statistics (${args.filter.fromDate} to ${args.filter.toDate}):\n` +
        `Total People: ${people.length}\n` +
        `\nPer-Person Metrics:\n` +
        people.map((person: any) => {
          const userId = person.userId || 'Unknown';
          const email = person.userEmailAddress || 'Unknown';
          const metricsArr = Array.isArray(person.personInteractionStats) ? person.personInteractionStats : [];
          const metricsStr = metricsArr
            .map((m: any) => `  - ${m.name || 'Metric'}: ${typeof m.value === 'number' ? m.value : (m.value ?? 'N/A')}`)
            .join('\n');
          return (
            `User: ${email} (ID: ${userId})\n` +
            `${metricsStr}`
          );
        }).join('\n\n')
      ];
      return { content };
    }
    
    // Try multiple possible shapes to extract an array of interactions
    let interactionsList: any[] | undefined;

    const candidates: any[] = [
      interactionsResponse?.interactions,
      interactionsResponse?.data?.interactions,
      interactionsResponse?.data,
      interactionsResponse?.records,
      interactionsResponse?.items,
      interactionsResponse?.list,
      interactionsResponse?.results,
      interactionsResponse?.events,
      Array.isArray(interactionsResponse) ? interactionsResponse : undefined,
    ].filter(Boolean);

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        interactionsList = candidate;
        break;
      }
    }

    // Fallback: scan shallow properties to find first array of objects
    if (!interactionsList && interactionsResponse && typeof interactionsResponse === 'object') {
      for (const value of Object.values(interactionsResponse)) {
        if (Array.isArray(value) && value.length >= 0) {
          interactionsList = value as any[];
          break;
        }
        if (value && typeof value === 'object') {
          for (const nested of Object.values(value)) {
            if (Array.isArray(nested)) {
              interactionsList = nested as any[];
              break;
            }
          }
          if (interactionsList) break;
        }
      }
    }

    if (!interactionsList || !Array.isArray(interactionsList)) {
      const availableKeys = Object.keys(interactionsResponse || {});
      throw new Error(`Unexpected API response structure - interactions not found (keys: ${availableKeys.join(', ')})`);
    }

    const content = [
      `Interaction Statistics (${args.filter.fromDate} to ${args.filter.toDate}):\n` +
      `Total Interactions: ${interactionsList.length}\n` +
      `\nInteraction Details:\n` +
      `${interactionsList.map(interaction => {
        const callId = extractCallId(interaction);
        const type = extractType(interaction);
        const ts = extractTimestamp(interaction);
        const dur = extractDurationSeconds(interaction);
        const parts = extractParticipants(interaction);
        const summary = interaction.summary || interaction.note || interaction.description || '';
        return (
          `Call ID: ${callId}\n` +
          `  Type: ${type}\n` +
          `  Timestamp: ${ts}\n` +
          `  Duration: ${formatDuration(dur)}\n` +
          `  Participants: ${parts}\n` +
          `${summary ? `  Summary: ${summary}` : ''}`
        );
      }).join('\n\n')}`
    ];

    return { content };
  } catch (error) {
    throw new Error(`Failed to get interaction stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}
