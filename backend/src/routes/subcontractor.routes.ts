import { Router, type Request, type Response } from "express";
import { z } from "zod";
import * as subService from "../services/subcontractor.service.js";
import { success, created, noContent } from "../utils/response.js";
import { asyncHandler } from "../middleware/index.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const router = Router();

router.use(authenticate);

// Validation schemas
const createSubSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  tradingName: z.string().optional(),
  registrationNo: z.string().optional(),
  vatNumber: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  country: z.string().default("GB"),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().optional(),
  primaryContactName: z.string().optional(),
  primaryContactEmail: z.string().email().optional(),
  primaryContactPhone: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insurancePolicyNo: z.string().optional(),
  insuranceExpiry: z.string().optional(),
  insuranceAmount: z.number().optional(),
  employerLiabilityExpiry: z.string().optional(),
  professionalIndemnityExpiry: z.string().optional(),
  tradeCategories: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  geographicCoverage: z.array(z.string()).optional(),
  paymentTerms: z.number().int().positive().default(30),
  accreditationType: z.array(z.string()).optional(),
  accreditationExpiry: z.string().optional(),
  notes: z.string().optional(),
});

const updateSubSchema = createSubSchema.partial().extend({
  status: z.enum(["ACTIVE", "SUSPENDED", "BLACKLISTED"]).optional(),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  rating: z.number().min(0).max(5).optional(),
});

const addDocumentSchema = z.object({
  documentType: z.enum(["INSURANCE", "LICENCE", "ACCREDITATION", "SAFETY_CERT", "FINANCIAL", "OTHER"]),
  documentRef: z.string().optional(),
  documentUrl: z.string().optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * POST /api/v1/subcontractors
 * Create a new subcontractor
 */
router.post(
  "/",
  validate(createSubSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sub = await subService.createSub(req.user!.id, req.body);
    created(res, sub, "Subcontractor created");
  })
);

/**
 * GET /api/v1/subcontractors
 * List subcontractors with filters
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const filters = {
      status: req.query.status as string | undefined,
      riskLevel: req.query.riskLevel as string | undefined,
      tradeCategory: req.query.tradeCategory as string | undefined,
      search: req.query.search as string | undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: Math.min(parseInt(req.query.limit as string) || 20, 100),
    };

    const result = await subService.listSubs(req.user!.id, filters);
    success(res, result);
  })
);

/**
 * GET /api/v1/subcontractors/compliance
 * Compliance dashboard data
 */
router.get(
  "/compliance",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await subService.getComplianceStatus(req.user!.id);
    success(res, result);
  })
);

/**
 * GET /api/v1/subcontractors/:id
 * Get subcontractor details
 */
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const sub = await subService.getSubById(req.user!.id, req.params.id);
    success(res, sub);
  })
);

/**
 * PATCH /api/v1/subcontractors/:id
 * Update subcontractor
 */
router.patch(
  "/:id",
  validate(updateSubSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const sub = await subService.updateSub(req.user!.id, req.params.id, req.body);
    success(res, sub, 200, "Subcontractor updated");
  })
);

/**
 * DELETE /api/v1/subcontractors/:id
 * Delete subcontractor
 */
router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    await subService.deleteSub(req.user!.id, req.params.id);
    noContent(res);
  })
);

/**
 * POST /api/v1/subcontractors/:id/documents
 * Add a document to a subcontractor
 */
router.post(
  "/:id/documents",
  validate(addDocumentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const doc = await subService.addDocument(req.user!.id, req.params.id, req.body);
    created(res, doc, "Document added");
  })
);

/**
 * PATCH /api/v1/subcontractors/:id/documents/:docId/verify
 * Verify a document
 */
router.patch(
  "/:id/documents/:docId/verify",
  asyncHandler(async (req: Request, res: Response) => {
    const doc = await subService.verifyDocument(req.user!.id, req.params.id, req.params.docId);
    success(res, doc, 200, "Document verified");
  })
);

export default router;