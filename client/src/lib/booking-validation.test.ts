import { describe, expect, it } from "vitest";

import {
  availabilityMessage,
  validateBookingDates,
} from "./booking-validation";

const start = "2030-01-10T10:00";
const end = "2030-01-10T12:00";

describe("booking validation", () => {
  it("rejects missing, invalid, and reversed dates", () => {
    expect(validateBookingDates("", "").error).toBe(
      "Select both a start and end date.",
    );
    expect(validateBookingDates("not-a-date", end).error).toBe(
      "Enter valid start and end dates.",
    );
    expect(validateBookingDates(end, start).error).toBe(
      "The end date and time must be after the start date and time.",
    );
  });

  it("accepts a valid booking period", () => {
    const result = validateBookingDates(start, end);

    expect(result.error).toBeNull();
    expect(result.startsAt?.toISOString()).toBe("2030-01-10T10:00:00.000Z");
    expect(result.endsAt?.toISOString()).toBe("2030-01-10T12:00:00.000Z");
  });

  it("explains unavailable period states", () => {
    expect(availabilityMessage([{ type: "RESERVED" }])).toContain(
      "already reserved",
    );
    expect(availabilityMessage([{ type: "MAINTENANCE" }])).toContain(
      "maintenance",
    );
    expect(availabilityMessage([{ type: "BLOCKED" }])).toContain("blocked");
    expect(availabilityMessage([])).toContain("not available");
  });
});
