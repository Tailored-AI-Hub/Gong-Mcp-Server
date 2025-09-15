import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { GongConnection } from "../utils/connection.js";

export const GET_TRANSCRIPT: Tool = {
  name: "gong_get_transcript",
  description: `Get transcript for one or more calls by their IDs.

Example:
{
  "filter": {
    "callIds": ["379333695432645797", "2167868958109749118"]
  }
}

Returns: For each call, a formatted transcript including speaker IDs and per-sentence timing with mm:ss ranges.

Notes:
- At least one callId is required.
- Not all calls have transcripts; if none are available, you'll receive a descriptive error.
- Timestamps are rendered for readability and may be rounded.`,
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
      }
    },
    required: ["filter"]
  }
};

export interface GetTranscriptArgs {
  callIds: string[];
}

export async function handleGetTranscript(conn: GongConnection, args: GetTranscriptArgs): Promise<{ content: string[] }> {
  try {
    // Validate required parameters
    if (!args.callIds || !Array.isArray(args.callIds) || args.callIds.length === 0) {
      throw new Error('callIds array is required and must not be empty');
    }

    const requestBody = {
      filter: {
        callIds: args.callIds
      }
    };

    // Call Gong API for transcripts
    const response = await conn.post<any>('/calls/transcript', requestBody);

    // Handle different possible API response structures
    let callTranscripts: any[] = [];
    
    if (response && response.callTranscripts && Array.isArray(response.callTranscripts)) {
      // Newer Gong API format
      callTranscripts = response.callTranscripts;
    } else if (response && response.transcripts && Array.isArray(response.transcripts)) {
      // Alternative transcripts property
      callTranscripts = response.transcripts;
    } else if (Array.isArray(response)) {
      // Direct array response
      callTranscripts = response;
    } else if (response && response.data && Array.isArray(response.data)) {
      // Nested data property
      callTranscripts = response.data;
    } else {
      // Log the actual response structure for debugging
      console.log('Unexpected transcript response structure:', typeof response, Object.keys(response || {}));
      throw new Error('Unexpected API response structure - callTranscripts not found in expected format');
    }

    if (callTranscripts.length === 0) {
      throw new Error("No transcripts found for the given call IDs.");
    }

    // Format each call transcript
    const content: string[] = callTranscripts.map((call: any) => {
      let out = `Transcript for Call ID: ${call.callId || call.call_id || 'Unknown'}\n`;
      
      // Handle different transcript structures
      let transcriptSegments: any[] = [];
      if (call.transcript && Array.isArray(call.transcript)) {
        transcriptSegments = call.transcript;
      } else if (call.segments && Array.isArray(call.segments)) {
        transcriptSegments = call.segments;
      } else if (call.data && Array.isArray(call.data)) {
        transcriptSegments = call.data;
      }
      
      out += `Total Segments: ${transcriptSegments.length}\n`;
      out += `\nTranscript:\n`;

      // Each segment may have multiple sentences
      for (const segment of transcriptSegments) {
        const speaker = segment.speakerId || segment.speaker_id || segment.speaker || 'Unknown';
        
        // Handle different sentence structures
        let sentences: any[] = [];
        if (segment.sentences && Array.isArray(segment.sentences)) {
          sentences = segment.sentences;
        } else if (segment.text) {
          // Single text segment
          sentences = [{ text: segment.text, start: segment.start || 0, end: segment.end || 0 }];
        }
        
        for (const sentence of sentences) {
          const startTime = sentence.start || sentence.startTime || 0;
          const endTime = sentence.end || sentence.endTime || 0;
          const text = sentence.text || 'No text available';
          out += `[${formatTime(startTime / 1000)} - ${formatTime(endTime / 1000)}] ${speaker}: ${text}\n`;
        }
      }
      return out.trim();
    });

    return { content };
  } catch (error) {
    throw new Error(`Failed to get transcript: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}
