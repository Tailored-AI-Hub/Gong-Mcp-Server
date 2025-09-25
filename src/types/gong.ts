export interface GongCall {
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

export interface GongRecords {
  totalRecords: number;
  currentPageSize: number;
  currentPageNumber: number;
  cursor?: string;
}

export interface GongCallResponse {
  requestId: string;
  calls: GongCall[];
  records: GongRecords;
}

export interface GongCallSingleResponse {
  requestId: string;
  call: GongCall;
}

export interface GongTranscriptResponse {
  requestId: string;
  records: GongRecords;
  callTranscripts: GongTranscript[];
}
export interface GongTranscript {
  callId: string;
  transcript: GongTranscriptSegment[];
}

export interface GongTranscriptSegment {
  speakerId: string;
  topic: any;
  sentences: GongTranscriptSentence[];
}

export interface GongTranscriptSentence {
  start: number;
  end: number;
  text: string;
}

export interface GongUser {
  id: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  created: string;
  title?: string;
  managerId?: string;
  active?: boolean;
}

export interface GongUserResponse {
  requestId: string;
  users: GongUser[];
  records: GongRecords;
}

export interface GongUserSingleResponse {
  requestId: string;
  user: GongUser;
}

export interface GongUserHistory {
  setting: string;
  value: string;
  time: string;
}

export interface GongUserHistoryResponse {
  requestId: string;
  userSettingsHistory: GongUserHistory[];
}

export interface GongActivityResponse {
  requestId: string;
  usersAggregateActivityStats: GongActivityStats[];
  records: GongRecords;
}

export interface GongActivityStats {
  userId: string;
  userEmailAddress: string;
  userAggregateActivityStats: {
    callsAsHost: number;
    callsGaveFeedback: number;
    callsRequestedFeedback: number;
    callsReceivedFeedback: number;
    ownCallsListenedTo: number;
    othersCallsListenedTo: number;
    callsSharedInternally: number;
    callsSharedExternally: number;
    callsScorecardsFilled: number;
    callsScorecardsReceived: number;
    callsAttended: number;
    callsCommentsGiven: number;
    callsCommentsReceived: number;
    callsMarkedAsFeedbackGiven: number;
    callsMarkedAsFeedbackReceived: number;
  };
}
export interface GongScorecardResponse {
  requestId: string;
  records: GongRecords;
  answeredScorecards: GongScorecard[];
}

export interface GongScorecard {
  answeredScorecardId: string;
  scorecardId: string;
  scorecardName: string;
  callId: string;
  callStartTime: string;
  reviewedUserId: string;
  reviewerUserId: string;
  reviewMethod: string;
  reviewTime: string;
  visibilityType: string;
  answers: GongScorecardAnswer[];
}

export interface GongScorecardAnswer {
  questionId: string;
  questionRevisionId: string;
  answerText: string;
  score: number;
  isOverall: boolean;
}

export interface GongInteractionResponse {
  requestId: string;
  peopleInteractionStats: GongInteraction[];
  records: GongRecords;
}

export interface GongInteraction {
  userId: string;
  userEmailAddress: string;
  personInteractionStats: GongInteractionStats[];
}

export interface GongInteractionStats {
  name: string;
  value: number;
}