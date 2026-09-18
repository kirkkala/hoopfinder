import type { Metadata } from "next";
import { NotFoundView } from "@/components/brand/NotFoundView";
import { getCopy } from "@/lib/copy";

const finnish = getCopy("fi");

export const metadata: Metadata = {
  title: finnish.notFoundTitle,
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return <NotFoundView />;
}
