import { Router, type Request, type Response } from "express";
import { z } from "zod";
import * as bidService from "../services/bid.service.js";
import { success, created, noContent } from "../utils/response.js";
import { asyncHandler } from "../middleware/index.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.use(authenticate);

// ─── Validation Schemas ─────────────────────────────────────────────────────────

const createPackageSchema = z.object({
  projectId: z.string(),
  name: z.string().min(2, "Name is required"),
  reference: z.string().optional(),
  description: z.string().optional(),
  scopeOfWork: z.string().optional(),
  specificationRef: z.string().optional(),
  contractType: z.string().optional(),
  estimatedValue: z.number().positive().optional(),
  tenderDate: z.string().optional(),
  submissionDeadline: z.string().optional(),
  siteVisitDate: z.string().optional(),
  queriesDeadline: z.string().optional(),
  invitedSubs: z.array(z.string()).optional(),
});

const createBidSchema = z.object({
  bidPackageId: z.string(),
  subcontractorId: z.string(),
  totalAmount: z.number().positive().optional(),
  vatAmount: z.number().optional(),
  grossAmount: z.number().optional(),
  programmeDays: z.number().int().positive().optional(),
  programmeStart: z.string().optional(),
  programmeEnd: z.string().optional(),
  exclusions: z.array(z.string()).optional(),
  qualifications: z.array(z.string()).optional(),
  assumptions: z.string().optional(),
  paymentTerms: z.string().optional(),
  warrantyPeriod: z.number().int().positive().optional(),
  retentionPercentage: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  lineItems: z.array(z.object({
    itemRef: z.string().optional(),
    description: z.string().min(1),
    unit: z.string().optional(),
    quantity: z.number().optional(),
    rate: z.number().optional(),
    amount: z.number().optional(),
    category: z.string().optional(),
    included: z.boolean().optional(),
    notes: z.string().optional(),
  })).optional(),
});

const lineItemSchema = z.object({
  itemRef: z.string().optional(),
  description: z.string().min(1),
  unit: z.string().optional(),
  quantity: z.number().optional(),
  rate: z.number().optional(),
  amount: z.number().optional(),
  category: z.string().optional(),
  included: z.boolean().optional(),
  notes: z.string().optional(),
});

const attachmentSchema = z.object({
  fileName: z.string(),
  fileUrl: z.string(),
  fileType: z.string(),
  fileSize: z.number().int().positive(),
  description: z.string().optional(),
});

// ─── Bid Package Routes ─────────────────────────────────────────────────────────

router.post(
  "/packages",
  validate(createPackageSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const pkg = await bidService.createBidPackage(req.user!.id, req.body);
    created(res, pkg, "Bid package created");
  })
);

router.get(
  "/packages",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await bidService.listBidPackages(req.user!.id, {
      projectId: req.query.projectId as string | undefined,
      status: req.query.status as string | undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: Math.min(parseInt(req.query.limit as string) || 20, 100),
    });
    success(res, result);
  })
);

router.get(
  "/packages/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const pkg = await bidService.getBidPackageById(req.user!.id, req.params.id);
    success(res, pkg);
  })
);

router.patch(
  "/packages/:id",
  validate(createPackageSchema.partial()),
  asyncHandler(async (req: Request, res: Response) => {
    const pkg = await bidService.updateBidPackage(req.user!.id, req.params.id, req.body);
    success(res, pkg, 200, "Bid package updated");
  })
);

router.post(
  "/packages/:id/invite",
  validate(z.object({ subIds: z.array(z.string()) })),
  asyncHandler(async (req: Request, res: Response) => {
    const pkg = await bidService.inviteSubs(req.user!.id, req.params.id, req.body.subIds);
    success(res, pkg, 200, "Subcontractors invited");
  })
);

router.post(
  "/packages/:id/uninvite",
  validate(z.object({ subId: z.string() })),
  asyncHandler(async (req: Request, res: Response) => {
    const pkg = await bidService.uninviteSub(req.user!.id, req.params.id, req.body.subId);
    success(res, pkg, 200, "Subcontractor removed");
  })
);

router.post(
  "/packages/:id/close",
  asyncHandler(async (req: Request, res: Response) => {
    const pkg = await bidService.closeBidPackage(req.user!.id, req.params.id);
    success(res, pkg, 200, "Bid package closed");
  })
);

router.post(
  "/packages/:id/award",
  validate(z.object({ bidId: z.string() })),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await bidService.awardBid(req.user!.id, req.params.id, req.body.bidId);
    success(res, result, 200, "Bid awarded");
  })
);

router.get(
  "/packages/:id/comparison",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await bidService.getComparisonMatrix(req.user!.id, req.params.id);
    success(res, result);
  })
);

// ─── Bid Routes ─────────────────────────────────────────────────────────────────

router.post(
  "/",
  validate(createBidSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const bid = await bidService.createBid(req.user!.id, req.body);
    created(res, bid, "Bid submitted");
  })
);

router.patch(
  "/:id",
  validate(createBidSchema.partial()),
  asyncHandler(async (req: Request, res: Response) => {
    const bid = await bidService.updateBid(req.user!.id, req.params.id, req.body);
    success(res, bid, 200, "Bid updated");
  })
);

router.post(
  "/:id/withdraw",
  asyncHandler(async (req: Request, res: Response) => {
    const bid = await bidService.withdrawBid(req.user!.id, req.params.id);
    success(res, bid, 200, "Bid withdrawn");
  })
);

// ─── Line Item Routes ───────────────────────────────────────────────────────────

router.post(
  "/:bidId/line-items",
  validate(lineItemSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const item = await bidService.addLineItem(req.user!.id, req.params.bidId, req.body);
    created(res, item, "Line item added");
  })
);

router.patch(
  "/:bidId/line-items/:itemId",
  validate(lineItemSchema.partial()),
  asyncHandler(async (req: Request, res: Response) => {
    const item = await bidService.updateLineItem(req.user!.id, req.params.itemId, req.body);
    success(res, item, 200, "Line item updated");
  })
);

router.delete(
  "/:bidId/line-items/:itemId",
  asyncHandler(async (req: Request, res: Response) => {
    await bidService.deleteLineItem(req.user!.id, req.params.itemId);
    noContent(res);
  })
);

// ─── Attachment Routes ──────────────────────────────────────────────────────────

router.post(
  "/:bidId/attachments",
  validate(attachmentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const attachment = await bidService.addAttachment(req.user!.id, req.params.bidId, req.body);
    created(res, attachment, "Attachment uploaded");
  })
);

export default router;