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
  role: "ADMIN" | "STUDENT" | "CLUB";
  organization?: Organization;
}

export type UserRole = User["role"];
