import { Router } from "express";

import {
  getInvoice,
  listMyInvoices,
  listVendorInvoices,
} from "../controllers/invoice-controller.js";
import { requireAuthentication } from "../middleware/authentication.js";
import { requireRoles } from "../middleware/authorization.js";
import { validateRequest } from "../middleware/validate-request.js";
import { listInvoiceQuerySchema } from "../schemas/invoice-schemas.js";
import { asyncHandler } from "../utils/async-handler.js";

export const invoiceRouter = Router();

invoiceRouter.use(requireAuthentication);

// Customer invoices
invoiceRouter.get(
  "/me",
  requireRoles("CUSTOMER"),
  validateRequest("query", listInvoiceQuerySchema),
  asyncHandler(listMyInvoices),
);

invoiceRouter.get(
  "/me/:invoiceId",
  requireRoles("CUSTOMER"),
  asyncHandler(getInvoice),
);

// Vendor invoices
invoiceRouter.get(
  "/vendor",
  requireRoles("VENDOR"),
  validateRequest("query", listInvoiceQuerySchema),
  asyncHandler(listVendorInvoices),
);

invoiceRouter.get(
  "/vendor/:invoiceId",
  requireRoles("VENDOR"),
  asyncHandler(getInvoice),
);
