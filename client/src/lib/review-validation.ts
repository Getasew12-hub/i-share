export function validateReviewInput(rentalId: string, rating: number) {
  if (!rentalId) {
    return "Select a completed rental to review.";
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return "Choose a rating from 1 to 5 stars.";
  }

  return null;
}
