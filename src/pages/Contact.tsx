import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, ExternalLink } from "lucide-react";

const Contact = () => {
  const email = "contact@phenotypeindex.com";

  const handleEmailClick = () => {
    window.open(`mailto:${email}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Contact Phindex | Get in Touch</title>
        <meta name="description" content="Contact the Phindex team to report content, request a profile removal, or ask about phenotype classification." />
        <link rel="canonical" href="https://www.phenotypeindex.com/contact" />
        <meta property="og:title" content="Contact Phindex | Get in Touch" />
        <meta property="og:description" content="Contact the Phindex team to report content, request a profile removal, or ask about phenotype classification." />
        <meta property="og:url" content="https://www.phenotypeindex.com/contact" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Phindex - Phenotype Index" />
        <meta property="og:image" content="https://www.phenotypeindex.com/og-default.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@phenotypeindex" />
        <meta name="twitter:title" content="Contact | Phindex" />
        <meta name="twitter:description" content="Contact the Phindex team to report content, request a profile removal, or ask about phenotype classification." />
        <meta name="twitter:image" content="https://www.phenotypeindex.com/og-default.png" />
      </Helmet>
      <Header />
      <AppSidebar />
      <main className="lg:ml-80 pt-16">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold">Contact Us</CardTitle>
              <CardDescription className="text-lg">
                We're here to help you. Get in touch with us!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Main Contact Card */}
              <Card className="border-primary/20">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="p-4 bg-primary/10 rounded-full">
                      <Mail className="h-8 w-8 text-primary" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-semibold mb-2">Primary Email</h3>
                      <p className="text-muted-foreground mb-4">
                        For questions, suggestions or technical support
                      </p>
                      <div className="bg-muted/50 p-3 rounded-lg mb-4">
                        <p className="font-mono text-lg">{email}</p>
                      </div>
                      <Button onClick={handleEmailClick} className="w-full">
                        <Mail className="h-4 w-4 mr-2" />
                        Send Email
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Information Cards */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Technical Support</h4>
                    <p className="text-sm text-muted-foreground">
                      Website issues, bugs or technical difficulties.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Suggestions</h4>
                    <p className="text-sm text-muted-foreground">
                      Ideas to improve the platform and new features.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Partnerships</h4>
                    <p className="text-sm text-muted-foreground">
                      Collaboration proposals and business partnerships.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">General</h4>
                    <p className="text-sm text-muted-foreground">
                      General questions about the platform and how to use it.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Response Time Info */}
              <Card className="bg-muted/50">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    <strong>Response time:</strong> We usually respond within 24 hours on business days.
                  </p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default Contact;