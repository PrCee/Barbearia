import { err, ok, Result } from "neverthrow";
import type { AppError } from "@/domain/errors";

export type { AppError };
export { err, ok };
export type AppResult<T> = Result<T, AppError>;
