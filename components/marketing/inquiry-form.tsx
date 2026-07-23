"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

import { submitInquiry } from "@/app/actions/inquiries";
import { inquirySchema, type InquiryValues } from "@/lib/validations/inquiry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function InquiryForm() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InquiryValues>({ resolver: zodResolver(inquirySchema) });

  async function onSubmit(values: InquiryValues) {
    try {
      await submitInquiry(values);
      setSubmitted(true);
      reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong — please try again.");
    }
  }

  return (
    <section id="partner" className="border-t bg-muted/30 py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Bring Quail Vending to your business</CardTitle>
              <CardDescription>
                Free installation, stocking, and service. Tell us a bit about your space and
                we&apos;ll follow up.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                  <p className="font-medium">Thanks — we got it!</p>
                  <p className="text-sm text-muted-foreground">
                    We&apos;ll reach out shortly to talk through next steps.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="business_name">Business name</Label>
                      <Input id="business_name" {...register("business_name")} />
                      {errors.business_name && (
                        <p className="text-sm text-destructive">{errors.business_name.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact_name">Your name</Label>
                      <Input id="contact_name" {...register("contact_name")} />
                      {errors.contact_name && (
                        <p className="text-sm text-destructive">{errors.contact_name.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" {...register("email")} />
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone (optional)</Label>
                      <Input id="phone" type="tel" {...register("phone")} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Where is your business?</Label>
                    <Input id="location" placeholder="Neighborhood, city, or address" {...register("location")} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Anything else we should know? (optional)</Label>
                    <Textarea id="message" placeholder="Foot traffic, space available, etc." {...register("message")} />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : "Request a machine"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
