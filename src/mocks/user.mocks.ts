import type { User, UserRole } from "../types/user";

export const DEFAULT_MOCK_ROLE: UserRole = "STUDENT";

export const MOCK_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  STUDENT: "User",
  CLUB: "Organisation",
};

export const MOCK_USERS: Record<UserRole, User> = {
  ADMIN: {
    id: "U-ADMIN-001",
    fullName: "Admin UET",
    email: "admin@uet.edu.vn",
    role: "ADMIN",
  },
  STUDENT: {
    id: "U-STUDENT-001",
    fullName: "Nguyễn Văn User",
    email: "student@uet.edu.vn",
    role: "STUDENT",
  },
  CLUB: {
    id: "U-CLUB-001",
    fullName: "Đại diện CLB Xanh",
    email: "club@uet.edu.vn",
    role: "CLUB",
    organization: {
      id: "ORG-001",
      name: "CLB Xanh UET",
      leaderEmail: "club@uet.edu.vn",
      leaderPhone: "0987 654 321",
    },
  },
};

export const getMockUserByRole = (role: UserRole) => MOCK_USERS[role];

