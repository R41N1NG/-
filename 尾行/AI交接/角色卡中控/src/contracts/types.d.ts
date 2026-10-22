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
  sequence?: number;
  receipts?: DailyReceipt[];
  lastReceipt?: DailyReceipt;
  period: number;
  spent: number;
  activity: {
    id: string;
    kind: "routine" | "tailing";
    name: string;
    cost: number;
    actionId?: string;
    payload?: Record<string, unknown>;
  } | null;
  ended: boolean;
  source: "legacy" | "daily";
}
export interface DailyToken {
  date: number;
  period: number;
  sequence: number;
}
export interface DailyReceipt {
  operationId: string;
  command: string;
  actionId: string | null;
  requestKey: string;
  cost: number;
  before: { date: number; period: number; remaining: number };
  after: { date: number; period: number; remaining: number };
  summary: string;
}
export interface DayPlanView extends DayPlan {
  date: number;
  budget: number;
  remaining: number;
  tailingCost: number;
  periodName: string;
  token?: DailyToken;
  sync?: { scope: string; epoch: number };
}
export interface EconomyOrder {
  id: string;
  date: number;
  total: number;
  channel: "retail" | "black_market";
  lines: {
    id: string;
    quantity: number;
    unitPrice: number;
    dueDate: number;
    delivered: boolean;
  }[];
}
export interface EconomyState {
  schema: 1;
  workedOn: number | null;
  lastWork: {
    jobId: string;
    name: string;
    date: number;
    income: number;
    stamina?: number;
  } | null;
  orders: EconomyOrder[];
}
export interface SavedGame {
  v: 2;
  sessionSalt: string;
  rngVersion: 1 | 2;
  floor: number;
  nightStartFloor: number;
  ledgerState: Record<string, number>;
  dayPlan?: DayPlan;
  economy?: EconomyState;
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
  locals?: { key: string; path: string[]; save: SavedGame }[];
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
