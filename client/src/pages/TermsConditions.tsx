import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import logoUrl from "@/assets/sts-logo.png";

export default function TermsConditions() {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <header className="mb-12 flex justify-between items-center">
          <Link href="/">
            <img src={logoUrl} alt="STS TaxRepair" className="h-12 w-auto cursor-pointer" />
          </Link>
          <Button variant="ghost" asChild>
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </Button>
        </header>

        <article className="prose prose-slate max-w-none">
          <h1 className="text-3xl font-bold mb-6">Terms & Conditions</h1>
          <p className="mb-4">Last Updated: January 5, 2026</p>
          
          <section className="mb-8 text-gray-700 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using the services provided by Stephedena Tax Services LLC ("we," "us," or "our"), you agree to be bound by these Terms & Conditions.</p>
          </section>

          <section className="mb-8 text-gray-700 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. SMS Program Terms</h2>
            <p>If you opt-in to our SMS program, you agree to receive text messages from us regarding your tax services. Consent to receive SMS is not a condition of purchase.</p>
            <p>You can cancel the SMS service at any time. Just text "STOP" to any message. After you send the SMS message "STOP" to us, we will send you an SMS message to confirm that you have been unsubscribed.</p>
          </section>

          <section className="mb-8 text-gray-700 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Service Description</h2>
            <p>STS Tax Repair provides tax preparation, amendment, and consultation services. We strive for accuracy but rely on the information provided by our clients.</p>
          </section>

          <section className="mb-8 text-gray-700 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Limitation of Liability</h2>
            <p>Stephedena Tax Services LLC shall not be liable for any indirect, incidental, or consequential damages arising out of your use of our services.</p>
          </section>

          <section className="mb-8 text-gray-700 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Contact Information</h2>
            <p>Questions about the Terms & Conditions should be sent to us at Info.ststax@gmail.com.</p>
          </section>
        </article>
      </div>
    </div>
  );
}

