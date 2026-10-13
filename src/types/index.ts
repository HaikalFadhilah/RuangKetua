// ==========================================
// AUTH TYPES
// ==========================================

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  role: string;
  className?: string | null;
  semester?: string | null;
  avatar?: string | null;
  university?: string | null;
}

// ==========================================
// FORUM TYPES
// ==========================================

export type ForumCategory = "PUBLIC" | "INTERNAL_CAMPUS";

export interface ForumPost {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: ForumCategory;
  university: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
    className: string | null;
    university: string | null;
  };
  _count: {
    comments: number;
  };
}

export interface ForumComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
    className: string | null;
    university: string | null;
  };
}

export interface ForumPostDetail extends ForumPost {
  comments: ForumComment[];
}

// ==========================================
// CHAT TYPES
// ==========================================

export interface ChatMessage {
  id: string;
  userId: string;
  content: string;
  category: ForumCategory; // "PUBLIC" | "INTERNAL_CAMPUS"
  university: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
    className: string | null;
    university: string | null;
  };
}

// ==========================================
// TASK TYPES
// ==========================================

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";

export interface TaskWithRelations {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  priority: Priority;
  status: TaskStatus;
  attachments: string | null;
  createdAt: string;
  updatedAt: string;
  course: { id: string; name: string } | null;
  subtasks: { id: string; title: string; completed: boolean }[];
  _count?: { subtasks: number };
}

// ==========================================
// COURSE TYPES
// ==========================================

export interface CourseWithRelations {
  id: string;
  name: string;
  sks: number | null;
  semester: string | null;
  schedule: string | null;
  scheduleDay: string | null;
  scheduleStart: string | null;
  scheduleEnd: string | null;
  dosenName: string | null;
  dosenWa: string | null;
  createdAt: string;
  _count?: {
    tasks: number;
    elearnings: number;
    materials: number;
  };
}

// ==========================================
// REMINDER TYPES
// ==========================================

export type ReminderType = "GENERAL" | "TASK" | "ELEARNING" | "EXAM" | "ASSIGNMENT";

// ==========================================
// CALENDAR TYPES
// ==========================================

export type CalendarType =
  | "KULIAH"
  | "PRAKTIKUM"
  | "SEMINAR"
  | "PRESENTASI"
  | "UTS"
  | "UAS"
  | "HOLIDAY"
  | "DEADLINE"
  | "ELEARNING"
  | "OTHER";

// ==========================================
// ACTIVITY LOG TYPES
// ==========================================

export interface ActivityLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  description: string;
  metadata: string | null;
  createdAt: string;
  user: { name: string };
}

// ==========================================
// STATISTICS TYPES
// ==========================================

export interface DashboardStats {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  overdueTasks: number;
  todayReminders: number;
  upcomingDeadlines: TaskWithRelations[];
  recentAnnouncements: { id: string; title: string; createdAt: string; category: string }[];
  tasksByPriority: { priority: string; count: number }[];
  tasksByCourse: { name: string; count: number }[];
  semesterProgress: number;
}
