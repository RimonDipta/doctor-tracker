export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const notFound = (entity: string) => new AppError(404, "NOT_FOUND", `${entity} not found`);
export const unauthorized = (message = "Authentication required") =>
  new AppError(401, "UNAUTHORIZED", message);
