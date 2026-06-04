export type UserRole = "MEMBER" | "ADMIN"; // Theo ENUM trong bảng Users

export interface Organization {
  org_email: string; // Khớp với org_email trong bảng Organizations
  org_name: string;
  description?: string;
}

export interface User {
  email: string; // Khớp với PRIMARY KEY trong bảng Users
  fullName: string; // Chuyển từ name để đồng bộ logic
  phone?: string;
  role: UserRole;
  organization?: Organization;
}