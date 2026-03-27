import HydrogenLayout from "@/layouts/hydrogen/layout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <HydrogenLayout>{children}</HydrogenLayout>;
}
