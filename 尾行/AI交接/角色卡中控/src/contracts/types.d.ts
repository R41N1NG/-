/** Shared JSON contracts. Runtime versions and timeline schema are independent. */
export type Distance = "far" | "same" | "close" | "touch";
export type Mode = "prepare" | "stealth" | "contact" | "vehicle";
export interface ActionInput {
  id?: string;
  name?: string;
  args?: {
    dist?: Distance;
    style?: "ambush" | "assault";
    [key: string]: unknown;
  };
}
export interface ChatMessage {
  id: string | number;
  role: "user" | "assistant" | "system";
  text: string;
  swipe?: number | null;
}
export interface HostContext {
  scope: string | null;
  history: ChatMessage[] | null;
}
export interface InventoryItem {
  id: string;
  count?: number;
  equipped?: boolean;
}
export interface Requirements {
  place?: string;
  dist?: Distance[];
  items?: string[];
}
export interface RequirementContext {
  placeKind: string;
  dist: Distance;
  inventory: InventoryItem[];
}
export interface DayPlan {
  schema: 1;
  period: number;
  spent: number;
  activity: { id: string; kind: "routine" | "tailing"; name: string; cost: number } | null;
  ended: boolean;
  source: "legacy" | "daily";
}
export interface DayPlanView extends DayPlan {
  date: number;
  budget: number;
  remaining: number;
  tailingCost: number;
  periodName: string;
}
export interface SavedGame {
  v: 2;
  sessionSalt: string;
  rngVersion: 1 | 2;
  floor: number;
  nightStartFloor: number;
  ledgerState: Record<string, number>;
  dayPlan?: DayPlan;
  [key: string]: unknown;
}
export interface TimelineNode {
  key: string;
  path: string[];
  before: SavedGame;
  afterInput: SavedGame;
  after: SavedGame;
  replyPath: string[] | null;
  result: Record<string, unknown>;
}
export interface Timeline {
  schema: 1;
  owner: string | null;
  revision: number;
  base: { path: string[]; save: SavedGame };
  nodes: TimelineNode[];
}
export interface SyncDiagnostics {
  schema: 1;
  events: {
    sequence: number;
    at: number;
    stage: string;
    floor?: number;
    code?: string;
  }[];
}
