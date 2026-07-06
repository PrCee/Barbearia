// Entidade Appointment — representa um agendamento confirmado

export interface Appointment {
  id: string;
  shopId: string;
  barberId: string;
  serviceId: string;
  clientId: string;
  date: Date;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  status: "confirmed" | "cancelled" | "no_show" | "completed";
  observation?: string;
  totalPrice?: number;
  reminderSent: boolean;
  productIds: string[];
  createdAt: Date;
}

// Slot disponível retornado pela grade dinâmica
export interface TimeSlot {
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  durationMinutes: number;
  price: number;
}

// Expediente de um dia da semana
export interface WorkingDay {
  dayOfWeek: number; // 0=dom, 1=seg, ... 6=sab
  startTime: string; // "08:00"
  endTime: string; // "19:00"
  breakStart?: string; // "12:00"
  breakEnd?: string; // "13:00"
}

// Agenda do barbeiro em um dia
export interface ScheduleDay {
  barberId: string;
  barberName: string;
  date: string;
  appointments: Appointment[];
  totalAppointments: number;
  totalRevenue: number;
  occupancyPercent: number; // % do expediente ocupado
}
