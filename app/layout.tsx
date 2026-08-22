import type { Metadata } from "next";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://math-research-portfolio.conjuguemos-2210.chatgpt.site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Sawyer Jacobson — Differential Geometry Researcher",
  description:
    "Research in differential geometry, geometric flows, minimal surfaces, singularities, and partial differential equations.",
  openGraph: {
    title: "Sawyer Jacobson — Differential Geometry Researcher",
    description:
      "An interactive archive of research in geometric flows, minimal surfaces, and elliptic PDE.",
    type: "website",
    images: [
      {
        url: `${siteUrl}/og.png`,
        width: 1729,
        height: 910,
        alt: "Sawyer Jacobson — Differential Geometry Researcher",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sawyer Jacobson — Differential Geometry Researcher",
    description:
      "An interactive archive of research in geometric flows, minimal surfaces, and elliptic PDE.",
    images: [`${siteUrl}/og.png`],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
