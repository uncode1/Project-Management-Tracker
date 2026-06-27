export interface ApiTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface ApiUser {
  id: number;
  email: string;
  full_name: string;
  role: string;
  team_id?: number | null;
}

export interface AuthResponse {
  user: ApiUser;
  tokens: ApiTokens;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  full_name: string;
  tenant_name?: string | null;
}

export interface TeamPayload {
  name: string;
  description?: string;
  lead_user_id?: number | null;
}

export interface TeamResponse {
  id: number;
  name: string;
  description?: string | null;
  lead_user_id?: number | null;
  member_count: number;
}

export interface ListPayload {
  title: string;
  position?: number;
}

export interface CardPayload {
  title: string;
  description?: string;
  due_date?: string;
  priority?: string;
  status?: string;
  assignee_id?: number | null;
  reporter_id?: number | null;
  list_id?: number;
  labels?: Array<{ color: string; name?: string }>;
}

export interface BoardPayload {
  name: string;
  description?: string;
  visibility?: string;
}

export interface ApiCard {
  id: number;
  board_id: number;
  list_id: number;
  title: string;
  description?: string | null;
  due_date?: string | null;
  priority?: string | null;
  status: string;
  assignee_id?: number | null;
  reporter_id?: number | null;
  labels?: Array<{ color: string; name?: string }>;
}

export interface ApiList {
  id: number;
  board_id: number;
  title: string;
  position: number;
  cards: ApiCard[];
}

export interface ApiBoard {
  id: number;
  name: string;
  description?: string | null;
  visibility: string;
  lists: ApiList[];
}

export interface ApiTeam {
  id: number;
  name: string;
  description?: string | null;
  lead_user_id?: number | null;
  member_count: number;
}

export interface ApiUserDirectory {
  id: number;
  email: string;
  full_name: string;
  role: string;
  team_id?: number | null;
}

export interface CreateUserPayload {
  full_name: string;
  email: string;
  role?: string;
  team_id?: number | null;
}

export interface UpdateUserPayload {
  full_name?: string;
  role?: string;
  team_id?: number | null;
}

export interface AiSummaryResponse {
  board_id: number;
  generated_at: string;
  summary: string;
  insights: string[];
  blockers: string[];
  recommendations: string[];
  risk_level: string;
  provider: string;
  using_fallback: boolean;
}

export interface AiIdea {
  title: string;
  description: string;
  impact: string;
}

export interface AiIdeasResponse {
  board_id: number;
  prompt: string;
  generated_at: string;
  ideas: AiIdea[];
  provider: string;
  using_fallback: boolean;
}
