import type { AvailabilityPeriodType } from "../types/product";

export type BookingDateValidation = {
  startsAt: Date | null;
  endsAt: Date | null;
  error: string | null;
};

export function validateBookingDates(
  startsAtValue: string,
  endsAtValue: string,
): BookingDateValidation {
  if (!startsAtValue || !endsAtValue) {
    return {
      startsAt: null,
      endsAt: null,
      error: "Select both a start and end date.",
    };
  }

  const startsAt = new Date(startsAtValue);
  const endsAt = new Date(endsAtValue);

  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return {
      startsAt: null,
      endsAt: null,
      error: "Enter valid start and end dates.",
    };
  }

  if (startsAt >= endsAt) {
    return {
      startsAt,
      endsAt,
      error: "The end date and time must be after the start date and time.",
    };
  }

  return { startsAt, endsAt, error: null };
}

export function availabilityMessage(
  conflicts: Array<{ type: AvailabilityPeriodType }>,
) {
  const conflictTypes = new Set(conflicts.map((conflict) => conflict.type));

  if (conflictTypes.has("RESERVED")) {
    return "This product is already reserved for part of that period.";
  }

  if (conflictTypes.has("MAINTENANCE")) {
    return "This product is unavailable because it is under maintenance during that period.";
  }

  if (conflictTypes.has("BLOCKED")) {
    return "This product is blocked from rental during that period.";
  }

  return "This product is not available for the selected period.";
}
