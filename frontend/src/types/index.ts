export type Role = "ADMIN" | "MANAGER" | "WORKER";

export type ProjectStatus =
  | "PLANNING"
  | "ACTIVE"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED";

export type CostCategory =
  | "MATERIALS"
  | "LABOR"
  | "EQUIPMENT"
  | "SUBCONTRACTOR"
  | "OVERHEAD"
  | "PERMITS"
  | "OTHER";

export type LogType = "GENERAL" | "PROGRESS" | "SAFETY" | "WEATHER" | "DELAY" | "INSPECTION";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  companyId: string | null;
  createdAt?: string;
  company?: {
    id: string;
    name: string;
  };
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  location: string;
  budget: number;
  startDate: string;
  endDate: string | null;
  ownerId: string;
  companyId: string | null;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  company?: {
    id: string;
    name: string;
  };
  _count?: {
    costs: number;
    logs: number;
    checklists: number;
    documents?: number;
  };
}

export interface Cost {
  id: string;
  category: CostCategory;
  description: string;
  amount: number;
  quantity: number;
  unit: string | null;
  projectId: string;
  aiEstimated: boolean;
  createdAt: string;
}

export interface DailyLog {
  id: string;
  type: LogType;
  content: string;
  summary: string | null;
  weather: string | null;
  crewSize: number | null;
  temperature: number | null;
  projectId: string;
  authorId: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    companyId: string | null;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ProjectStats {
  totalProjects: number;
  totalBudget: number;
  byStatus: { status: ProjectStatus; count: number }[];
}