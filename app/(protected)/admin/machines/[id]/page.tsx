import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function MachineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: machine } = await supabase.from("machines").select("*").eq("id", id).single();

  if (!machine) notFound();

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/machines">← Machines</Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {machine.name}
            <Badge variant={machine.status === "active" ? "default" : "secondary"}>
              {machine.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-start gap-4">
          {machine.image_url && (
            <Image
              src={machine.image_url}
              alt={machine.name}
              width={96}
              height={96}
              className="h-24 w-24 shrink-0 rounded-md object-cover"
            />
          )}
          <div className="text-sm text-muted-foreground">
            <p>{machine.location || "No location set"}</p>
            {machine.address && <p>{machine.address}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
