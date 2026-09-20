export type ContentType = 'material' | 'game';

export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  avatarUrl?: string; // If empty or undefined, display WhatsApp generic gray silhouette
  bannerType: 'gradient' | 'image' | 'color';
  bannerValue: string;
  university: string;
  career: string;
  currentSemester: number; // 1 to 10
  enrolledSubjects: string[];
  isIncognito: boolean; // Hides nickname and scores in public rankings
  bio: string;
  rpPoints: number; // League Points
  streakDays: number;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface University {
  id: string;
  name: string;
  acronym: string;
  country: string;
}

export interface Career {
  id: string;
  name: string;
  universityId: string;
}

export interface Subject {
  id: string;
  name: string;
  careerId: string;
  semester: number;
}

export interface PendingRequest {
  id: string;
  type: 'university' | 'career' | 'subject';
  customValue: string;
  relatedEntityName?: string;
  submittedByUsername: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'merged';
  adminNotes?: string;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

// Blocks Definitions
export type BlockType = 
  | 'content_card'
  | 'flashcard'
  | 'connect'
  | 'sequence'
  | 'fill_blank'
  | 'swipe_classify'
  | 'error_detect'
  | 'hotspot'
  | 'true_false_rush'
  | 'slider_estimator';

export interface BaseBlock {
  id: string;
  type: BlockType;
  title?: string;
  imageUrl?: string;
}

export interface ContentCardBlockData extends BaseBlock {
  type: 'content_card';
  body: string;
  calloutType?: 'info' | 'key_concept' | 'summary' | 'formula';
}

export interface FlashcardBlockData extends BaseBlock {
  type: 'flashcard';
  question: string;
  answer: string;
  reversePrompt?: string;
  userMastery?: 'easy' | 'medium' | 'hard';
}

export interface ConnectPair {
  id: string;
  left: string;
  right: string;
}

export interface ConnectBlockData extends BaseBlock {
  type: 'connect';
  prompt: string;
  pairs: ConnectPair[];
}

export interface SequenceItem {
  id: string;
  text: string;
  correctOrder: number;
}

export interface SequenceBlockData extends BaseBlock {
  type: 'sequence';
  prompt: string;
  items: SequenceItem[];
}

export interface FillBlankBlockData extends BaseBlock {
  type: 'fill_blank';
  sentence: string; // e.g., "La derivada de sen(x) es [cos(x)]."
  mode: 'multiple_choice' | 'free_text';
  options: string[]; // For multiple choice A, B, C, D
  correctAnswer: string; // Case-insensitive validation
  explanation?: string;
}

export interface SwipeClassifyItem {
  id: string;
  text: string;
  category: string;
}

export interface SwipeClassifyBlockData extends BaseBlock {
  type: 'swipe_classify';
  prompt: string;
  categories: string[]; // 2 for swipe left/right, >2 for boxes below
  items: SwipeClassifyItem[];
}

export interface ErrorDetectBlockData extends BaseBlock {
  type: 'error_detect';
  instruction: string;
  targetZone: {
    xPercent: number; // 0 - 100
    yPercent: number; // 0 - 100
    radiusPercent: number; // hit tolerance
  };
  explanation: string;
}

export interface HotspotPoint {
  id: string;
  label: string;
  xPercent: number;
  yPercent: number;
  stepOrder?: number;
}

export interface HotspotBlockData extends BaseBlock {
  type: 'hotspot';
  instruction: string;
  isSequential: boolean; // Strict sequential order vs free
  hotspots: HotspotPoint[];
  explanation?: string;
}

export interface TrueFalseItem {
  id: string;
  statement: string;
  isTrue: boolean;
  explanation: string;
}

export interface TrueFalseRushBlockData extends BaseBlock {
  type: 'true_false_rush';
  statements: TrueFalseItem[];
}

export interface SliderEstimatorBlockData extends BaseBlock {
  type: 'slider_estimator';
  prompt: string;
  min: number;
  max: number;
  unit: string;
  correctValue: number;
  tolerance: number; // +/- error range allowed
  explanation: string;
}

export type InteractiveBlock =
  | ContentCardBlockData
  | FlashcardBlockData
  | ConnectBlockData
  | SequenceBlockData
  | FillBlankBlockData
  | SwipeClassifyBlockData
  | ErrorDetectBlockData
  | HotspotBlockData
  | TrueFalseRushBlockData
  | SliderEstimatorBlockData;

// Classroom Presentation Card
export interface StudyItemCard {
  id: string;
  title: string;
  description: string;
  contentType: ContentType;
  accessCode: string; // 6-character unique code e.g. "CALC-92"
  authorId: string;
  authorUsername: string;
  authorUniversity: string;
  authorAvatar?: string;
  subjectName: string;
  universityName: string;
  semester: number;
  coverType: 'gradient' | 'image' | 'color';
  coverValue: string;
  rating: number; // 1.0 to 5.0
  ratingsCount: number;
  activePlayers: number; // 🎮
  isFavorite: boolean;
  folderId?: string;
  blocks: InteractiveBlock[];
  createdAt: string;
}

export interface SoloGameSession {
  gameId: string;
  gameTitle: string;
  totalTimeSeconds: number;
  accuracyPercent: number;
  correctAnswers: number;
  totalQuestions: number;
  avgResponseTimeSeconds: number;
  playedAt: string;
  score: number;
}

export interface RoomPlayer {
  id: string;
  username: string;
  avatarUrl?: string;
  isIncognito: boolean;
  score: number;
  roundScore: number;
  isReady: boolean;
  isHost: boolean;
  hasAnsweredCurrentRound: boolean;
  speedBonusApplied: boolean;
}

export interface MultiplayerRoom {
  id: string;
  roomCode: string; // 4 characters e.g. "7K2M"
  name: string;
  gameId: string;
  gameTitle: string;
  isPrivate: boolean; // Private requires 4-char code, doesn't grant RP. Public grants RP.
  format: '1v1' | 'group'; // Duelo 1v1 o Sala 2-5 jugadores
  maxPlayers: number; // 2 to 5
  players: RoomPlayer[];
  state: 'lobby' | 'countdown' | 'in_round' | 'round_leaderboard' | 'match_ended';
  currentQuestionIndex: number;
  totalQuestions: number;
  secondsRemainingInRound: number;
  roundStartTime: number;
}

export interface TournamentMatch {
  id: string;
  roundName: string; // 'Cuartos de Final' | 'Semifinal' | 'Gran Final'
  player1: { id: string; username: string; score?: number };
  player2: { id: string; username: string; score?: number };
  winnerId?: string;
  status: 'pending' | 'live' | 'finished';
}

export interface Tournament {
  id: string;
  title: string;
  subject: string;
  date: string;
  exactTime: string;
  prizeDescription: string;
  status: 'upcoming' | 'live' | 'completed';
  participantsCount: number;
  bracket: TournamentMatch[];
}

export interface VisualTemplate {
  id: string;
  name: string;
  category: 'gradient' | 'academic' | 'tech' | 'minimal';
  type: 'gradient' | 'image' | 'color';
  value: string;
}
