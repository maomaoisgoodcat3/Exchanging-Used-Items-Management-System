export type UserRole = "ADMIN" | "STUDENT" | "CLUB";

export interface Organization {
  id: string;
  name: string;
  leaderEmail: string;
  leaderPhone: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  organization?: Organization;
}

