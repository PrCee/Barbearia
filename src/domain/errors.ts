// Tipos de erro do domínio — toda falha possível é mapeada aqui.
// UseCases retornam Result<T, AppError> via neverthrow.

export type AppError =
  | { type: "CONCURRENCY_CONFLICT"; message: string }
  | { type: "SLOT_UNAVAILABLE"; message: string; nextAvailable?: string }
  | { type: "BARBER_NOT_FOUND"; message: string }
  | { type: "SERVICE_NOT_FOUND"; message: string }
  | { type: "SHOP_NOT_FOUND"; message: string }
  | { type: "CLIENT_NOT_FOUND"; message: string }
  | { type: "PRODUCT_NOT_FOUND"; message: string }
  | { type: "INVALID_TIME_RANGE"; message: string }
  | { type: "OUTSIDE_WORKING_HOURS"; message: string }
  | { type: "VALIDATION_ERROR"; message: string; fields: Record<string, string> }
  | { type: "UNAUTHORIZED"; message: string }
  | { type: "DATABASE_ERROR"; message: string };

// Mapeamento de AppError → HTTP status
export function errorToHttpStatus(error: AppError): number {
  switch (error.type) {
    case "CONCURRENCY_CONFLICT":
    case "SLOT_UNAVAILABLE":
      return 409;
    case "VALIDATION_ERROR":
      return 400;
    case "UNAUTHORIZED":
      return 401;
    case "SHOP_NOT_FOUND":
    case "BARBER_NOT_FOUND":
    case "SERVICE_NOT_FOUND":
    case "CLIENT_NOT_FOUND":
    case "PRODUCT_NOT_FOUND":
      return 404;
    case "DATABASE_ERROR":
    case "INVALID_TIME_RANGE":
    case "OUTSIDE_WORKING_HOURS":
      return 500;
  }
}

// Mensagens amigáveis para o cliente final
export function errorToUserMessage(error: AppError): string {
  switch (error.type) {
    case "CONCURRENCY_CONFLICT":
      return "Este horário acabou de ser reservado. Por favor, escolha outro.";
    case "SLOT_UNAVAILABLE":
      return error.nextAvailable
        ? `Horário indisponível. Próximo disponível: ${error.nextAvailable}`
        : "Horário indisponível. Por favor, escolha outro.";
    case "OUTSIDE_WORKING_HOURS":
      return "O horário selecionado está fora do expediente.";
    case "VALIDATION_ERROR":
      return "Dados inválidos. Verifique os campos e tente novamente.";
    default:
      return "Ocorreu um erro. Por favor, tente novamente.";
  }
}
