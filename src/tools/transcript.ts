import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { GongConnection } from "../utils/connection.js";
import { GongTranscript, GongTranscriptResponse, GongTranscriptSegment, GongTranscriptSentence } from "../types/gong.js";
import { buildPaginationParams, computeAndFormatPagination } from "../utils/helpers.js";

export const GET_TRANSCRIPT: Tool = {
  name: "gong_get_transcript",
  description: `Get transcript for one or more calls by their IDs.

Example:
{
  "filter": {
    "callIds": ["379333695432645797", "2167868958109749118"]
  },
  "pageNumber": 0,
  "pageSize": 100,
}

Returns: For each call, a formatted transcript including speaker IDs and per-sentence timing with mm:ss ranges.

Notes:
- At least one callId is required.
- Not all calls have transcripts; if none are available, you'll receive a descriptive error.
- Timestamps are rendered for readability and may be rounded.
- Use pageNumber (zero-based) and pageSize to paginate.`,
  inputSchema: {
    type: "object",
    properties: {
      filter: {
        type: "object",
        properties: {
          callIds: {
            type: "array",
            items: {
              type: "string"
            },
            description: "Array of call IDs to get transcripts for"
          }
        },
        required: ["callIds"]
      },
      pageNumber: {
        type: "number",
        description: "Zero-based page number to fetch"
      },
      pageSize: {
        type: "number",
        description: "Number of calls per page (e.g., 100)"
      },
    },
    required: ["filter"]
  }
};

export interface GetTranscriptArgs {
  callIds: string[];
  pageNumber?: number;
  pageSize?: number;
}

export async function handleGetTranscript(conn: GongConnection, args: GetTranscriptArgs): Promise<{ content: string[] }> {
  try {
    // Validate required parameters
    if (!args.callIds || !Array.isArray(args.callIds) || args.callIds.length === 0) {
      throw new Error('callIds array is required and must not be empty');
    }

    const paginationParams = buildPaginationParams(args);

    const params = {
      ...paginationParams,
      filter: {
        callIds: args.callIds
      },
    };

    // Call Gong API for transcripts
    const response = await conn.get<GongTranscriptResponse>('/calls/transcript', params);

    if (!response.callTranscripts || response.callTranscripts.length === 0) {
      throw new Error('No transcripts found');
    }

    const content: string[] = response.callTranscripts.map((call: GongTranscript) => {
      let out = `Transcript for Call ID: ${call.callId}\n`;
      out += `Total Segments: ${Array.isArray(call.transcript) ? call.transcript.length : 0}\n`;
      out += `\nTranscript:\n`;
      for (const segment of (call.transcript || [])) {
        out += `Speaker ID: ${segment.speakerId}\n`;
        out += `Total Sentences: ${Array.isArray(segment.sentences) ? segment.sentences.length : 0}\n`;
        out += `\nSentences:\n`;
        const sentences = (segment.sentences || []).map((sentence: GongTranscriptSentence) => {
          return `[${formatTime(sentence.start / 1000)} - ${formatTime(sentence.end / 1000)}] ${sentence.text}`;
        });
        out += sentences.join('\n');
        out += `\n\n`;
      }
      return out.trim();
    });

    const { summary: paginationInfo } = computeAndFormatPagination(
      response.records || { totalRecords: content.length, currentPageSize: content.length, currentPageNumber: 0 },
      typeof args.pageNumber === 'number' ? args.pageNumber : 0,
      typeof args.pageSize === 'number' ? args.pageSize : response.callTranscripts.length,
      response.callTranscripts.length
    );

    return { content: [paginationInfo, ...content] };
  } catch (error) {
    throw new Error(`Failed to get transcript: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}
