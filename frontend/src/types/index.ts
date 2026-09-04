export type UserRole =
  | "TEAM_MEMBER"
  | "MANAGER"
  | "ADMIN";

export type User = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isActive?: boolean;
  createdAt?: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterDetails = {
  fullName: string;
  email: string;
  password: string;
};

export type AuthResponse = {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
};