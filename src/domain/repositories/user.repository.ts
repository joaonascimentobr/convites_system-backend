export interface IUserRepository {
  create(email: string, passwordHash: string): Promise<{ id: number; email: string }>;
  findByEmail(email: string): Promise<{ id: number; email: string; password: string } | null>;
  findById(id: number): Promise<{ id: number; email: string } | null>;
}
