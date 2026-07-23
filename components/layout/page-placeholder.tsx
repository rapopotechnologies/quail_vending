import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function PagePlaceholder({
  title,
  description,
  phase,
}: {
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Coming in {phase}.</p>
      </CardContent>
    </Card>
  );
}
