import { useMutation, useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { useState } from "react";

import { useAuth } from "../hooks/use-auth";
import { apiErrorMessage } from "../lib/api-errors";
import { validateReviewInput } from "../lib/review-validation";
import { listMyBookings } from "../services/booking-service";
import { reviewService } from "../services/review-service";
import type { Review } from "../types/review";

function renderStars(rating: number): JSX.Element {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

export function ReviewsPage() {
  const { accessToken, user } = useAuth();
  const [page, setPage] = useState(1);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");
  const [selectedRentalId, setSelectedRentalId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isVendor = user?.role === "VENDOR";

  const reviewsQuery = useQuery({
    queryKey: ["reviews", page, isVendor],
    queryFn: () =>
      isVendor
        ? reviewService.listVendorReviews(page, 20)
        : reviewService.listMyReviews(page, 20),
    enabled: Boolean(accessToken),
  });

  const bookingsQuery = useQuery({
    queryKey: ["my-bookings-for-reviews"],
    queryFn: () => listMyBookings(accessToken ?? ""),
    enabled: Boolean(accessToken && !isVendor),
  });

  const completedRentalIds = new Set(
    (reviewsQuery.data?.reviews ?? []).map((review) => review.rentalId),
  );
  const eligibleBookings = (bookingsQuery.data ?? []).filter(
    (booking) =>
      booking.rental?.status === "COMPLETED" &&
      !completedRentalIds.has(booking.rental.id),
  );

  const createReviewMutation = useMutation({
    mutationFn: (input: {
      rentalId: string;
      rating: number;
      comment?: string;
    }) => reviewService.createReview(input),
    onSuccess: () => {
      void reviewsQuery.refetch();
      void bookingsQuery.refetch();
      setNewReviewRating(5);
      setNewReviewComment("");
      setSelectedRentalId("");
      setFormError(null);
      setSuccessMessage("Your review was submitted successfully.");
    },
  });

  const handleCreateReview = () => {
    setFormError(null);
    setSuccessMessage(null);

    const validationError = validateReviewInput(
      selectedRentalId,
      newReviewRating,
    );

    if (validationError) {
      setFormError(validationError);
      return;
    }

    createReviewMutation.mutate({
      rentalId: selectedRentalId,
      rating: newReviewRating,
      comment: newReviewComment.trim() || undefined,
    });
  };

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <section className="mx-auto w-full max-w-5xl">
        <h1 className="text-3xl font-semibold tracking-normal">
          {isVendor ? "Product Reviews" : "My Reviews"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {isVendor
            ? "View reviews for your rental products."
            : "Manage your reviews and ratings for completed rentals."}
        </p>

        {!isVendor && (
          <div className="mt-8 rounded-lg border border-border bg-white p-6">
            <h2 className="font-medium">Create a New Review</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Share your experience with a product after your rental is
              completed.
            </p>

            <div className="mt-4 space-y-4">
              {eligibleBookings.length > 0 && (
                <label className="grid gap-2 text-sm font-medium">
                  Completed rental
                  <select
                    className="rounded-lg border border-border px-3 py-2"
                    value={selectedRentalId}
                    onChange={(event) => setSelectedRentalId(event.target.value)}
                  >
                    <option value="">Select a rental</option>
                    {eligibleBookings.map((booking) => (
                      <option key={booking.rental!.id} value={booking.rental!.id}>
                        {booking.product.name} - {new Date(booking.endsAt).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {eligibleBookings.length === 0 && (
                <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                  No completed rentals are currently eligible for a review.
                </p>
              )}

              <div>
                <label className="text-sm font-medium">Rating</label>
                <div className="mt-2 flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setNewReviewRating(star)}
                      className="text-2xl transition-colors"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= newReviewRating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300 hover:text-yellow-200"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="comment" className="text-sm font-medium">
                  Comment
                </label>
                <textarea
                  id="comment"
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  placeholder="Share your thoughts about this rental..."
                  className="mt-2 w-full rounded-lg border border-border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={4}
                />
              </div>

              <button
                onClick={handleCreateReview}
                disabled={
                  createReviewMutation.isPending || eligibleBookings.length === 0
                }
                className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {createReviewMutation.isPending ? "Creating..." : "Post Review"}
              </button>
              {formError && (
                <p className="text-sm text-destructive">{formError}</p>
              )}
              {createReviewMutation.isError && (
                <p className="text-sm text-destructive">
                  {apiErrorMessage(
                    createReviewMutation.error,
                    "The review could not be submitted.",
                  )}
                </p>
              )}
              {successMessage && (
                <p className="text-sm text-primary">{successMessage}</p>
              )}
            </div>
          </div>
        )}

        {reviewsQuery.isLoading && (
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((index) => (
              <div
                className="h-32 animate-pulse rounded-lg border border-border bg-white"
                key={index}
              />
            ))}
          </div>
        )}

        {reviewsQuery.isError && (
          <div className="mt-6 rounded-lg border border-destructive/40 bg-white p-6 text-sm text-destructive">
            Your reviews could not be loaded.
          </div>
        )}

        {reviewsQuery.data?.reviews &&
          reviewsQuery.data.reviews.length === 0 && (
            <div className="mt-8 rounded-lg border border-border bg-white p-12 text-center">
              <Star className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-3 font-medium">No reviews yet</p>
              <p className="text-sm text-muted-foreground">
                {isVendor
                  ? "You don't have any reviews for your products yet."
                  : "You haven't posted any reviews yet. Complete a rental and leave a review to share your experience."}
              </p>
            </div>
          )}

        {reviewsQuery.data?.reviews && (
          <>
            <div className="mt-6 space-y-4">
              {reviewsQuery.data.reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-lg border border-border bg-white p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                        <span className="text-sm text-muted-foreground">
                          ({review.rating}/5)
                        </span>
                      </div>
                      {review.comment && (
                        <p className="mt-3 text-sm">{review.comment}</p>
                      )}
                      <p className="mt-2 text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`ml-4 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        review.status === "PUBLISHED"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {review.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of{" "}
                {Math.ceil((reviewsQuery.data.total || 0) / 20) || 1}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-border px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPage((p) =>
                      p < Math.ceil((reviewsQuery.data?.total || 0) / 20)
                        ? p + 1
                        : p,
                    )
                  }
                  disabled={
                    page >= Math.ceil((reviewsQuery.data?.total || 0) / 20)
                  }
                  className="rounded-lg border border-border px-4 py-2 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
