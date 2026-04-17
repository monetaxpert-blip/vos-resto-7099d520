/**
 * Local reservation store (Phase 1). Backend-ready shape for future API.
 */
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Reservation {
  id: string;
  restaurantId: string;
  restaurantName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  guests: number;
  status: ReservationStatus;
  createdAt: string;
}

const KEY = 'vosresto.reservations';

function read(): Reservation[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(list: Reservation[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function getAllReservations(): Reservation[] {
  return read().sort(
    (a, b) =>
      new Date(`${b.date}T${b.time}`).getTime() -
      new Date(`${a.date}T${a.time}`).getTime()
  );
}

export function createReservation(
  data: Omit<Reservation, 'id' | 'status' | 'createdAt'>
): Reservation {
  const list = read();
  // Prevent same restaurant + date + time duplicate
  const dup = list.find(
    (r) =>
      r.restaurantId === data.restaurantId &&
      r.date === data.date &&
      r.time === data.time &&
      r.status !== 'cancelled'
  );
  if (dup) throw new Error('Vous avez déjà une réservation à cet horaire.');

  const reservation: Reservation = {
    ...data,
    id: `res_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  };
  write([reservation, ...list]);
  return reservation;
}

export function cancelReservation(id: string) {
  const list = read().map((r) =>
    r.id === id ? { ...r, status: 'cancelled' as const } : r
  );
  write(list);
}
