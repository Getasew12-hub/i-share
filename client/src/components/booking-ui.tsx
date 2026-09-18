import {
  CalendarDays,
  Check,
  ChevronRight,
  Circle,
  CreditCard,
  FileText,
  MapPin,
  Package,
} from "lucide-react";
import { Link } from "react-router-dom";

import type { Booking, BookingStatus, RentalEvent } from "../types/booking";
import type { PaymentStatus } from "../types/payment";
import type { InvoiceStatus } from "../types/invoice";
import { StatusBadge, Surface } from "./ui";

export function bookingTone(status: BookingStatus) {
  if (status === "CONFIRMED" || status === "ACTIVE" || status === "COMPLETED") {
    return "success" as const;
  }
  if (status === "PENDING") return "warning" as const;
  if (status === "REJECTED" || status === "CANCELLED" || status === "EXPIRED") {
    return "danger" as const;
  }
  return "neutral" as const;
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <StatusBadge tone={bookingTone(status)}>{status}</StatusBadge>;
}

export function PriceBreakdown({
  booking,
  estimated,
}: {
  booking: Pick<
    Booking,
    | "rentalDuration"
    | "unitPriceSnapshot"
    | "rentalSubtotal"
    | "deliveryCharge"
    | "securityDeposit"
    | "totalAmount"
    | "currency"
  >;
  estimated?: boolean;
}) {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-start justify-between gap-4">
        <span className="text-muted-foreground">
          Rental subtotal ({booking.rentalDuration} × {booking.unitPriceSnapshot} {booking.currency})
        </span>
        <span className="font-semibold">{booking.rentalSubtotal} {booking.currency}</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Delivery</span>
        <span>{booking.deliveryCharge} {booking.currency}</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-muted-foreground">Security deposit</span>
        <span>{booking.securityDeposit} {booking.currency}</span>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-border pt-3 text-base font-bold">
        <span>{estimated ? "Estimated total" : "Total"}</span>
        <span>{booking.totalAmount} {booking.currency}</span>
      </div>
    </div>
  );
}

function eventLabel(eventType: string) {
  return eventType
    .split("_")
    .join(" ")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (letter: string) => letter.toUpperCase());
}

export function BookingTimeline({
  booking,
  events = [],
}: {
  booking: Pick<Booking, "status" | "createdAt" | "updatedAt" | "rental">;
  events?: RentalEvent[];
}) {
  const milestones = [
    { label: "Booking requested", date: booking.createdAt, complete: true },
    {
      label: "Vendor confirmation",
      date: booking.status === "PENDING" ? null : booking.updatedAt,
      complete: !["PENDING", "REJECTED", "CANCELLED", "EXPIRED"].includes(booking.status),
    },
    {
      label: "Rental started",
      date: booking.rental?.pickupDate ?? null,
      complete: ["ACTIVE", "COMPLETED"].includes(booking.status),
    },
    {
      label: "Rental completed",
      date: booking.rental?.actualReturnDate ?? null,
      complete: booking.status === "COMPLETED",
    },
  ];

  return (
    <div className="space-y-5">
      {milestones.map((milestone) => (
        <div className="flex gap-3" key={milestone.label}>
          <span
            className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${
              milestone.complete ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {milestone.complete ? <Check aria-hidden="true" size={15} /> : <Circle aria-hidden="true" size={10} />}
          </span>
          <div>
            <p className="text-sm font-bold">{milestone.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {milestone.date ? new Date(milestone.date).toLocaleString() : "Waiting for the next step"}
            </p>
          </div>
        </div>
      ))}
      {events.length > 0 && (
        <div className="border-t border-border pt-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Rental activity</p>
          <div className="space-y-3">
            {events.map((event) => (
              <div className="flex items-start justify-between gap-4 text-sm" key={event.id}>
                <div>
                  <p className="font-semibold">{eventLabel(event.eventType)}</p>
                  {event.notes && <p className="mt-1 text-xs text-muted-foreground">{event.notes}</p>}
                </div>
                <time className="shrink-0 text-xs text-muted-foreground">{new Date(event.occurredAt).toLocaleDateString()}</time>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function PaymentInvoiceState({
  paymentStatus,
  invoiceStatus,
}: {
  paymentStatus?: PaymentStatus;
  invoiceStatus?: InvoiceStatus;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl bg-muted/70 p-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
          <CreditCard aria-hidden="true" size={15} /> Payment
        </div>
        <p className="mt-2 font-bold">{paymentStatus ?? "Not started"}</p>
      </div>
      <div className="rounded-xl bg-muted/70 p-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
          <FileText aria-hidden="true" size={15} /> Invoice
        </div>
        <p className="mt-2 font-bold">{invoiceStatus ?? "Not issued"}</p>
      </div>
    </div>
  );
}

export function BookingCard({
  booking,
  paymentStatus,
}: {
  booking: Booking;
  paymentStatus?: PaymentStatus;
}) {
  return (
    <Link
      className="group block rounded-2xl border border-border bg-surface p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg sm:p-5"
      to={`/bookings/me/${booking.id}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted sm:size-24 sm:shrink-0">
          {booking.product.imageUrl ? (
            <img alt={booking.product.name} className="h-full w-full object-cover" src={booking.product.imageUrl} />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground"><Package aria-hidden="true" size={24} /></div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">{booking.product.category.name}</p>
              <h2 className="mt-1 truncate text-lg font-bold group-hover:text-primary">{booking.product.name}</h2>
            </div>
            <BookingStatusBadge status={booking.status} />
          </div>
          <div className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <span className="inline-flex items-center gap-2"><CalendarDays aria-hidden="true" size={15} />{new Date(booking.startsAt).toLocaleDateString()} - {new Date(booking.endsAt).toLocaleDateString()}</span>
            <span className="inline-flex items-center gap-2"><MapPin aria-hidden="true" size={15} />{booking.product.city || booking.product.country || "Location not specified"}</span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-border pt-3 sm:block sm:border-t-0 sm:pt-0 sm:text-right">
          <div>
            <p className="text-lg font-black">{booking.totalAmount} {booking.currency}</p>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">Payment: {paymentStatus ?? "Not started"}</p>
          </div>
          <ChevronRight aria-hidden="true" className="text-primary sm:ml-auto sm:mt-2" size={18} />
        </div>
      </div>
    </Link>
  );
}
