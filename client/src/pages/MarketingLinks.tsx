import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useBranding } from "@/hooks/useBranding";
import type { User } from "@shared/mysql-schema";
import { Copy, ExternalLink, Link2, Settings } from "lucide-react";
import { Link } from "wouter";

type LinkItem = {
  label: string;
  description: string;
  href: string;
};

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall back
  }

  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.focus();
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

export default function MarketingLinks() {
  const { toast } = useToast();

  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const officeId = (currentUser as any)?.officeId || undefined;
  const { branding } = useBranding(officeId);
  const slug = branding?.officeSlug || undefined;
  const companyName = branding?.companyName || "STS TaxRepair";

  const origin = useMemo(() => window.location.origin, []);
  const withOffice = (path: string) =>
    slug ? `${origin}${path}?_office=${encodeURIComponent(slug)}` : `${origin}${path}`;

  const links: LinkItem[] = useMemo(() => {
    return [
      {
        label: "Client Login Link",
        description: "Send this to clients so they can sign in to your portal.",
        href: withOffice("/client-login"),
      },
      {
        label: "Client Registration Link",
        description: "Send this to new clients so they register under your office.",
        href: withOffice("/register"),
      },
      {
        label: "Book Appointment Link",
        description: "Public booking page. Appointment requests will be tied to your office.",
        href: withOffice("/book-appointment"),
      },
      {
        label: "Branded Landing Page",
        description: "Optional: a link to the homepage with your office context.",
        href: withOffice("/"),
      },
    ];
  }, [origin, slug]);

  const handleCopy = async (href: string) => {
    const ok = await copyToClipboard(href);
    toast({
      title: ok ? "Copied" : "Copy failed",
      description: ok ? "Link copied to clipboard." : "Please copy the link manually.",
      variant: ok ? "default" : "destructive",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Marketing Links
          </h1>
          <p className="text-sm text-muted-foreground">
            Quick share links for <span className="font-medium">{companyName}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/branding">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Branding / Slug
            </Button>
          </Link>
        </div>
      </div>

      {!officeId ? (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Office not detected</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Your account does not appear to be assigned to an office, so we can’t generate office-specific links.
            </p>
            <p>
              If you’re a Tax Office user, please make sure your account has an <code>officeId</code> set.
            </p>
          </CardContent>
        </Card>
      ) : !slug ? (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Set your office slug first</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              Your office needs a <span className="font-medium">Subdomain Slug</span> (used as <code>?_office=slug</code>)
              so we can generate your share links.
            </p>
            <Link href="/branding">
              <Button>
                <Settings className="h-4 w-4 mr-2" />
                Go to Branding
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {links.map((item) => (
            <Card key={item.label} className="hover:border-primary/40 transition-colors">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-primary" />
                  {item.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{item.description}</p>

                <div className="rounded-md border bg-muted/30 p-3 text-xs break-all">
                  {item.href}
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => handleCopy(item.href)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  <a href={item.href} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Separator />

      <div className="text-xs text-muted-foreground">
        These links use <code>?_office=slug</code> to keep your office context (no wildcard DNS required).
      </div>
    </div>
  );
}

