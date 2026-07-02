export type RegisterInput = {
  name?: string;
  email?: string;
  password?: string;
};

export type LoginInput = {
  email?: string;
  password?: string;
};

export type AuthUser = {
  id: string;
  name: string | null;
  email: string;
};

export type LoginOutput = {
  token: string;
  user: AuthUser;
};
