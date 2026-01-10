import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  User, 
  DollarSign, 
  Key, 
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { SignaturePad, type SignaturePadRef } from "@/components/SignaturePad";
import type { Form8879Data } from "@shared/mysql-schema";

interface Form8879Props {
  clientName?: string;
  clientAddress?: string;
  clientCity?: string;
  clientState?: string;
  clientZip?: string;
  initialData?: Form8879Data;
  onSubmit: (formData: Form8879Data, signatureData: string) => void;
  isSubmitting?: boolean;
  // ERO PIN is an office/agent value; clients often should not be forced to enter it.
  eroPinMode?: "required" | "optional" | "hidden";
}

export function Form8879({ 
  clientName = "", 
  clientAddress = "",
  clientCity = "",
  clientState = "",
  clientZip = "",
  initialData,
  onSubmit,
  isSubmitting = false,
  eroPinMode = "required",
}: Form8879Props) {
  const signaturePadRef = useRef<SignaturePadRef>(null);
  const currentYear = new Date().getFullYear();
  
  const [formData, setFormData] = useState<Form8879Data>({
    taxYear: initialData?.taxYear || String(currentYear - 1),
    taxpayerName: initialData?.taxpayerName || clientName,
    taxpayerSSN: initialData?.taxpayerSSN || "",
    spouseName: initialData?.spouseName || "",
    spouseSSN: initialData?.spouseSSN || "",
    address: initialData?.address || clientAddress,
    city: initialData?.city || clientCity,
    state: initialData?.state || clientState,
    zipCode: initialData?.zipCode || clientZip,
    agi: initialData?.agi || "",
    totalTax: initialData?.totalTax || "",
    federalRefund: initialData?.federalRefund || "",
    amountOwed: initialData?.amountOwed || "",
    eroPin: initialData?.eroPin || "",
    taxpayerPin: initialData?.taxpayerPin || "",
    spousePin: initialData?.spousePin || "",
    practitionerPin: initialData?.practitionerPin || "",
    dateOfBirth: initialData?.dateOfBirth || "",
    priorYearAgi: initialData?.priorYearAgi || "",
    identityProtectionPin: initialData?.identityProtectionPin || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (clientName && !formData.taxpayerName) {
      setFormData(prev => ({ ...prev, taxpayerName: clientName }));
    }
  }, [clientName]);

  const updateField = (field: keyof Form8879Data, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const formatSSN = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 9);
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  };

  const formatCurrency = (value: string) => {
    const digits = value.replace(/[^0-9.]/g, '');
    const parts = digits.split('.');
    if (parts.length > 2) return parts[0] + '.' + parts[1];
    return digits;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.taxpayerName?.trim()) {
      newErrors.taxpayerName = "Taxpayer name is required";
    }
    
    if (!formData.taxpayerSSN || formData.taxpayerSSN.replace(/\D/g, '').length !== 9) {
      newErrors.taxpayerSSN = "Valid SSN is required (9 digits)";
    }
    
    const shouldRequireEroPin = eroPinMode === "required";
    const ero = (formData.eroPin || "").trim();
    if (shouldRequireEroPin && !ero) {
      newErrors.eroPin = "ERO PIN is required";
    } else if (ero) {
      if (ero.length !== 5 || !/^\d+$/.test(ero)) {
        newErrors.eroPin = "ERO PIN must be 5 digits";
      }
    }
    
    if (!formData.taxpayerPin?.trim()) {
      newErrors.taxpayerPin = "Taxpayer PIN is required";
    } else if (formData.taxpayerPin.length !== 5 || !/^\d+$/.test(formData.taxpayerPin)) {
      newErrors.taxpayerPin = "PIN must be 5 digits";
    }

    if (signaturePadRef.current?.isEmpty()) {
      newErrors.signature = "Signature is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    
    const signatureData = signaturePadRef.current?.toDataURL() || "";
    onSubmit(formData, signatureData);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card className="border-2 border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">IRS Form 8879</CardTitle>
              <CardDescription>
                IRS e-file Signature Authorization for Tax Year {formData.taxYear}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <User className="h-5 w-5 text-primary" />
              <span>Part I - Taxpayer Information</span>
            </div>
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxpayerName">
                  Taxpayer Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="taxpayerName"
                  value={formData.taxpayerName}
                  onChange={(e) => updateField("taxpayerName", e.target.value)}
                  placeholder="Full legal name"
                  className={errors.taxpayerName ? "border-destructive" : ""}
                  data-testid="input-taxpayer-name"
                />
                {errors.taxpayerName && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.taxpayerName}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="taxpayerSSN">
                  Social Security Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="taxpayerSSN"
                  value={formData.taxpayerSSN}
                  onChange={(e) => updateField("taxpayerSSN", formatSSN(e.target.value))}
                  placeholder="XXX-XX-XXXX"
                  maxLength={11}
                  className={errors.taxpayerSSN ? "border-destructive" : ""}
                  data-testid="input-taxpayer-ssn"
                />
                {errors.taxpayerSSN && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.taxpayerSSN}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="spouseName">Spouse Name (if filing jointly)</Label>
                <Input
                  id="spouseName"
                  value={formData.spouseName}
                  onChange={(e) => updateField("spouseName", e.target.value)}
                  placeholder="Spouse's full legal name"
                  data-testid="input-spouse-name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="spouseSSN">Spouse SSN</Label>
                <Input
                  id="spouseSSN"
                  value={formData.spouseSSN}
                  onChange={(e) => updateField("spouseSSN", formatSSN(e.target.value))}
                  placeholder="XXX-XX-XXXX"
                  maxLength={11}
                  data-testid="input-spouse-ssn"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="Street address"
                data-testid="input-address"
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2 col-span-2 md:col-span-1">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="City"
                  data-testid="input-city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  placeholder="ST"
                  maxLength={2}
                  data-testid="input-state"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => updateField("zipCode", e.target.value)}
                  placeholder="00000"
                  maxLength={10}
                  data-testid="input-zip"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <DollarSign className="h-5 w-5 text-primary" />
              <span>Part II - Tax Return Information</span>
            </div>
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agi">Adjusted Gross Income (Line 11)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="agi"
                    value={formData.agi}
                    onChange={(e) => updateField("agi", formatCurrency(e.target.value))}
                    placeholder="0.00"
                    className="pl-7"
                    data-testid="input-agi"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="totalTax">Total Tax (Line 24)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="totalTax"
                    value={formData.totalTax}
                    onChange={(e) => updateField("totalTax", formatCurrency(e.target.value))}
                    placeholder="0.00"
                    className="pl-7"
                    data-testid="input-total-tax"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="federalRefund">Federal Income Tax Refund (Line 35a)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="federalRefund"
                    value={formData.federalRefund}
                    onChange={(e) => updateField("federalRefund", formatCurrency(e.target.value))}
                    placeholder="0.00"
                    className="pl-7"
                    data-testid="input-federal-refund"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amountOwed">Amount You Owe (Line 37)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="amountOwed"
                    value={formData.amountOwed}
                    onChange={(e) => updateField("amountOwed", formatCurrency(e.target.value))}
                    placeholder="0.00"
                    className="pl-7"
                    data-testid="input-amount-owed"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Key className="h-5 w-5 text-primary" />
              <span>Part III - PIN Authorization</span>
              <Badge variant="secondary" className="ml-2">Required</Badge>
            </div>
            <Separator />
            
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {eroPinMode === "required" ? (
                  <>
                    <strong>Important:</strong> Enter your unique 5-digit ERO PIN provided by STS TaxRepair.{" "}
                    This PIN authorizes the electronic filing of your tax return.
                  </>
                ) : (
                  <>
                    <strong>Important:</strong> Choose your 5-digit Taxpayer PIN.{" "}
                    The ERO PIN will be completed by your assigned agent.
                  </>
                )}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {eroPinMode !== "hidden" && (
                <div className="space-y-2">
                  <Label htmlFor="eroPin" className="flex items-center gap-2">
                    ERO PIN {eroPinMode === "required" && <span className="text-destructive">*</span>}
                    <Badge variant="outline" className="text-xs">5 digits</Badge>
                  </Label>
                  <Input
                    id="eroPin"
                    value={formData.eroPin}
                    onChange={(e) => updateField("eroPin", e.target.value.replace(/\D/g, '').slice(0, 5))}
                    placeholder="00000"
                    maxLength={5}
                    className={`text-center text-lg font-mono tracking-widest ${errors.eroPin ? "border-destructive" : ""}`}
                    data-testid="input-ero-pin"
                  />
                  {errors.eroPin && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.eroPin}
                    </p>
                  )}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="taxpayerPin" className="flex items-center gap-2">
                  Taxpayer PIN <span className="text-destructive">*</span>
                  <Badge variant="outline" className="text-xs">5 digits</Badge>
                </Label>
                <Input
                  id="taxpayerPin"
                  value={formData.taxpayerPin}
                  onChange={(e) => updateField("taxpayerPin", e.target.value.replace(/\D/g, '').slice(0, 5))}
                  placeholder="00000"
                  maxLength={5}
                  className={`text-center text-lg font-mono tracking-widest ${errors.taxpayerPin ? "border-destructive" : ""}`}
                  data-testid="input-taxpayer-pin"
                />
                {errors.taxpayerPin && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.taxpayerPin}
                  </p>
                )}
              </div>
              
              {formData.spouseName && (
                <div className="space-y-2">
                  <Label htmlFor="spousePin" className="flex items-center gap-2">
                    Spouse PIN
                    <Badge variant="outline" className="text-xs">5 digits</Badge>
                  </Label>
                  <Input
                    id="spousePin"
                    value={formData.spousePin}
                    onChange={(e) => updateField("spousePin", e.target.value.replace(/\D/g, '').slice(0, 5))}
                    placeholder="00000"
                    maxLength={5}
                    className="text-center text-lg font-mono tracking-widest"
                    data-testid="input-spouse-pin"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="practitionerPin" className="flex items-center gap-2">
                  Practitioner PIN
                  <Badge variant="outline" className="text-xs">Optional</Badge>
                </Label>
                <Input
                  id="practitionerPin"
                  value={formData.practitionerPin}
                  onChange={(e) => updateField("practitionerPin", e.target.value.replace(/\D/g, '').slice(0, 5))}
                  placeholder="00000"
                  maxLength={5}
                  className="text-center text-lg font-mono tracking-widest"
                  data-testid="input-practitioner-pin"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => updateField("dateOfBirth", e.target.value)}
                  data-testid="input-dob"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priorYearAgi">Prior Year AGI</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="priorYearAgi"
                    value={formData.priorYearAgi}
                    onChange={(e) => updateField("priorYearAgi", formatCurrency(e.target.value))}
                    placeholder="0.00"
                    className="pl-7"
                    data-testid="input-prior-agi"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="identityProtectionPin">Identity Protection PIN</Label>
                <Input
                  id="identityProtectionPin"
                  value={formData.identityProtectionPin}
                  onChange={(e) => updateField("identityProtectionPin", e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6 digits (if issued)"
                  maxLength={6}
                  className="text-center font-mono tracking-widest"
                  data-testid="input-ip-pin"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span>Part IV - Signature</span>
            </div>
            <Separator />
            
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="mb-2">
                <strong>Declaration:</strong> I consent to allow my electronic return originator (ERO), STS TaxRepair, 
                to send my return to the IRS and to receive acknowledgment of receipt or reason for rejection.
              </p>
              <p>
                By signing below, I authorize the IRS to accept this form as if it were an original signature.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Your Signature <span className="text-destructive">*</span></Label>
              <div className={`border-2 rounded-lg ${errors.signature ? "border-destructive" : "border-border"}`}>
                <SignaturePad ref={signaturePadRef} />
              </div>
              {errors.signature && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {errors.signature}
                </p>
              )}
              <div className="flex justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => signaturePadRef.current?.clear()}
                >
                  Clear Signature
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="gradient-primary border-0 min-w-[200px]"
              data-testid="button-submit-form"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Sign & Submit Form 8879
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
