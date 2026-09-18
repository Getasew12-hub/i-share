import type { Booking } from "../types/booking";

export function canCancelCustomerBooking(status: Booking["status"]) {
  return status === "PENDING" || status === "CONFIRMED";
}

export function canConfirmVendorBooking(status: Booking["status"]) {
  return status === "PENDING";
}

export function canRejectVendorBooking(status: Booking["status"]) {
  return status === "PENDING";
}

export function canCancelVendorBooking(status: Booking["status"]) {
  return status === "PENDING" || status === "CONFIRMED";
}

export function canStartVendorRental(booking: Booking) {
  const rental = booking.rental;

  return (
    booking.status === "CONFIRMED" &&
    Boolean(rental) &&
    (rental?.status === "CONFIRMED" || rental?.status === "PAID")
  );
}

export function canCompleteVendorRental(booking: Booking) {
  const rental = booking.rental;

  return (
    booking.status === "ACTIVE" &&
    Boolean(rental) &&
    (rental?.status === "ACTIVE" || rental?.status === "IN_PROGRESS")
  );
}
