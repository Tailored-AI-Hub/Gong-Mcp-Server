export interface GongCall {
  call: {
    id: string;
    url: string;
    direction?: string;
    title?: string;
    scheduled?: string;
    started?: string;
    duration?: number;
    primaryUserId?: string;
    language?: string;
    purpose?: string;
  }
}

export interface GongParticipant {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

export interface GongCallMetadata {
  callType?: string;
  direction?: string;
  status?: string;
  recordingUrl?: string;
}

export interface GongTranscript {
  callId: string;
  transcript: GongTranscriptSegment[];
  metadata?: GongTranscriptMetadata;
}

export interface GongTranscriptSegment {
  speakerId: string;
  speakerName: string;
  text: string;
  startTime: number;
  endTime: number;
  confidence?: number;
}

export interface GongTranscriptMetadata {
  language?: string;
  wordCount?: number;
  duration?: number;
}

export interface GongUser {
  id: string;
  name: string;
  email: string;
  title?: string;
  department?: string;
  managerId?: string;
  isActive?: boolean;
}

export interface GongActivityStats {
  userId: string;
  totalCalls: number;
  totalDuration: number;
  averageCallDuration: number;
  callsByType: Record<string, number>;
  callsByDirection: Record<string, number>;
}

export interface GongActivityAggregateFilter {
  filter: {
    fromDate: string;
    toDate: string;
    __userIds?: string[];
  }
}

export interface GongActivityAggregateResponse {
  totalCalls: number;
  totalDuration: number;
  averageCallDuration: number;
  callsByType: Record<string, number>;
  callsByDirection: Record<string, number>;
  callsByUser: Record<string, GongActivityStats>;
}

export interface GongActivityPeriodFilter extends GongActivityAggregateFilter {
  aggregationPeriod: 'DAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';
}

export interface GongActivityPeriodResponse {
  periods: Array<{
    period: string;
    totalCalls: number;
    totalDuration: number;
    averageCallDuration: number;
  }>;
}

export interface GongDayByDayFilter extends GongActivityPeriodFilter {
  includeWeekends?: boolean;
}

export interface GongDayByDayResponse {
  dailyStats: Array<{
    date: string;
    totalCalls: number;
    totalDuration: number;
    averageCallDuration: number;
    callsByType: Record<string, number>;
  }>;
}

export interface GongScorecardFilter extends GongActivityPeriodFilter {
  scorecardType?: string;
  includeMetrics?: string[];
}

export interface GongScorecardResponse {
  scorecards: Array<{
    period: string;
    score: number;
    metrics: Record<string, number>;
    insights: string[];
  }>;
}

export interface GongInteractionFilter extends GongActivityAggregateFilter {
  interactionTypes?: string[];
  includeTranscripts?: boolean;
}

export interface GongInteractionResponse {
  interactions: Array<{
    callId: string;
    interactionType: string;
    timestamp: string;
    duration: number;
    participants: string[];
    summary?: string;
  }>;
}

export interface GongError {
  statusCode: number;
  message: string;
  details?: string;
}

export interface GongApiResponse<T> {
  success: boolean;
  data?: T;
  error?: GongError;
}
