// Entidade Service — serviço oferecido (ex: Barba, Corte)

export interface Service {
  id: string;
  shopId: string;
  name: string;
  durationMinutes: number;
  price: number;
  active: boolean;
}
