export interface User {
  id: string;
  fullName: string;
  email: string;
  role: "ADMIN" | "STUDENT" | "CLUB";
}