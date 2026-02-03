import { getDatabase, ref, push, set, update } from 'firebase/database';
import { database } from '../../config/SupabaseConfig';

export const saveBooking = async (bookingData) => {
  const bookingRef = ref(database, 'bookings');
  const newBookingRef = push(bookingRef);

  try {
    // Crea la reserva
    await set(newBookingRef, bookingData);
    const bookingUid = newBookingRef.key; // Obtén el UID de la reserva creada

    // Actualiza la reserva recién creada con el UID en el campo bookinguid
    const bookingUpdateRef = ref(database, `bookings/${bookingUid}`);
    await update(bookingUpdateRef, { id: bookingUid });

    // Retorna el éxito y el UID
    return { success: true, uid: bookingUid };
  } catch (error) {
    console.error('Error saving booking:', error);
    return { success: false, error };
  }
};
