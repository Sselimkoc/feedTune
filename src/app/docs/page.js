import { notFound } from "next/navigation";
import DocsClient from "./DocsClient";

export default function DocsPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <DocsClient />;
}
