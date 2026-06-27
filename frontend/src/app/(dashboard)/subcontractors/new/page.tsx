"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function NewSubcontractorPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    companyName: "",
    tradingName: "",
    registrationNo: "",
    vatNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postcode: "",
    phone: "",
    email: "",
    website: "",
    primaryContactName: "",
    primaryContactEmail: "",
    primaryContactPhone: "",
    insuranceProvider: "",
    insurancePolicyNo: "",
    insuranceExpiry: "",
    insuranceAmount: "",
    paymentTerms: "30",
    notes: "",
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post("/subcontractors", {
        ...formData,
        insuranceExpiry: formData.insuranceExpiry || undefined,
        insuranceAmount: formData.insuranceAmount ? parseFloat(formData.insuranceAmount) : undefined,
        paymentTerms: parseInt(formData.paymentTerms) || 30,
      }),
    onSuccess: (response) => {
      const sub = response.data.data as { id: string };
      router.push(`/subcontractors/${sub.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Subcontractor</h1>
        <p className="text-muted-foreground">Add a new subcontractor to your directory</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Company Details */}
          <Card>
            <CardHeader>
              <CardTitle>Company Details</CardTitle>
              <CardDescription>Basic company information</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input id="companyName" value={formData.companyName} onChange={(e) => updateField("companyName", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tradingName">Trading Name</Label>
                <Input id="tradingName" value={formData.tradingName} onChange={(e) => updateField("tradingName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="registrationNo">Companies House Reg. No.</Label>
                <Input id="registrationNo" value={formData.registrationNo} onChange={(e) => updateField("registrationNo", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vatNumber">VAT Number</Label>
                <Input id="vatNumber" value={formData.vatNumber} onChange={(e) => updateField("vatNumber", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="primaryContactName">Primary Contact</Label>
                <Input id="primaryContactName" value={formData.primaryContactName} onChange={(e) => updateField("primaryContactName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primaryContactEmail">Contact Email</Label>
                <Input id="primaryContactEmail" type="email" value={formData.primaryContactEmail} onChange={(e) => updateField("primaryContactEmail", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primaryContactPhone">Contact Phone</Label>
                <Input id="primaryContactPhone" value={formData.primaryContactPhone} onChange={(e) => updateField("primaryContactPhone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" value={formData.website} onChange={(e) => updateField("website", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Office Phone</Label>
                <Input id="phone" value={formData.phone} onChange={(e) => updateField("phone", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">General Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => updateField("email", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader><CardTitle>Address</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="addressLine1">Address Line 1</Label>
                <Input id="addressLine1" value={formData.addressLine1} onChange={(e) => updateField("addressLine1", e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="addressLine2">Address Line 2</Label>
                <Input id="addressLine2" value={formData.addressLine2} onChange={(e) => updateField("addressLine2", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" value={formData.city} onChange={(e) => updateField("city", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postcode">Postcode</Label>
                <Input id="postcode" value={formData.postcode} onChange={(e) => updateField("postcode", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Insurance */}
          <Card>
            <CardHeader><CardTitle>Insurance & Compliance</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                <Input id="insuranceProvider" value={formData.insuranceProvider} onChange={(e) => updateField("insuranceProvider", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insurancePolicyNo">Policy Number</Label>
                <Input id="insurancePolicyNo" value={formData.insurancePolicyNo} onChange={(e) => updateField("insurancePolicyNo", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insuranceExpiry">Insurance Expiry</Label>
                <Input id="insuranceExpiry" type="date" value={formData.insuranceExpiry} onChange={(e) => updateField("insuranceExpiry", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insuranceAmount">Cover Amount (£)</Label>
                <Input id="insuranceAmount" type="number" value={formData.insuranceAmount} onChange={(e) => updateField("insuranceAmount", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms (days)</Label>
                <Input id="paymentTerms" type="number" value={formData.paymentTerms} onChange={(e) => updateField("paymentTerms", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {createMutation.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                {(createMutation.error as { error?: { message?: string } })?.error?.message || "Failed to create subcontractor"}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <CardFooter className="flex justify-end gap-3 pt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</> : "Create Subcontractor"}
          </Button>
        </CardFooter>
      </form>
    </div>
  );
}