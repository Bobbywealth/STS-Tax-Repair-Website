import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import logoUrl from "@/assets/sts-logo.png";

export default function PrivacyPolicy() {
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
          <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
          <p className="mb-4">Last Updated: January 5, 2026</p>
          
          <section className="mb-8 text-gray-700 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
            <p>We collect information you provide directly to us, such as when you create an account, book an appointment, or contact us for support. This may include your name, email address, phone number, and tax-related information.</p>
          </section>

          <section className="mb-8 text-gray-700 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. SMS Consent and Messaging</h2>
            <p>By providing your phone number and opting in to receive SMS messages, you agree to receive communications from Stephedena Tax Services LLC. These messages may include appointment reminders, consultation scheduling, and tax preparation updates.</p>
            <p>Message and data rates may apply. You can opt out at any time by replying STOP to any message. For help, reply HELP.</p>
          </section>

          <section className="mb-8 text-gray-700 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <p>We use the information we collect to provide and improve our services, communicate with you, and comply with legal obligations.</p>
          </section>

          <section className="mb-8 text-gray-700 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at ststaxrepair@gmail.com.</p>
          </section>
        </article>
      </div>
    </div>
  );
}

