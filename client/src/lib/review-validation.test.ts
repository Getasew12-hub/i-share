import { describe, expect, it } from "vitest";

import { validateReviewInput } from "./review-validation";

describe("review validation", () => {
  it("requires a completed rental selection", () => {
    expect(validateReviewInput("", 5)).toContain("completed rental");
  });

  it("requires a whole-number rating from one through five", () => {
    expect(validateReviewInput("rental-1", 0)).toContain("1 to 5");
    expect(validateReviewInput("rental-1", 5.5)).toContain("1 to 5");
    expect(validateReviewInput("rental-1", 5)).toBeNull();
  });
});