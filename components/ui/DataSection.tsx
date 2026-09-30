import { Card, CardHeader } from "./Card";

export function DataSection({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} action={action} />
      {children}
    </Card>
  );
}
