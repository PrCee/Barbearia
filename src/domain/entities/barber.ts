// Entidade Barber — profissional dentro de uma barbearia

export interface Barber {
  id: string;
  shopId: string;
  name: string;
  email: string;
  image?: string;
  role: "admin" | "barber";
  active: boolean;
}
