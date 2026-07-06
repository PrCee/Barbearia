// Entidade Shop — representa uma barbearia (tenant)

export interface Shop {
  id: string;
  alias: string; // slug único para URL: /barbearia-do-ze
  name: string;
  address?: string;
  phone?: string;
  logoUrl?: string;
}
