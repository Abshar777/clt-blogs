import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import "font-awesome/css/font-awesome.min.css";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CLT Academy | Blogs",
  description: "CLT Academy is a platform for learning trading and investing.",
  keywords:"clt blogs",
  openGraph: {
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
      },
    ],
    title: "CLT Academy",
    description: "CLT Academy is a platform for learning trading and investing.",
    url: "https://clt-academy.com",
    siteName: "CLT Academy",
    locale: "uae",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CLT Academy",
    description: "CLT Academy is a platform for learning trading and investing.",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/logo.png",
  },
  alternates: {
    canonical: "https://clt-academy.com",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  verification: {
    google: "google-site-verification=1234567890",
  },
  authors: [{ name: "CLT Academy", url: "https://clt-academy.com" }],
  creator: "CLT Academy",
  publisher: "CLT Academy",
  category: "education",
 
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
          <link rel="stylesheet" href="https://unpkg.com/react-quill-new@1.0.2/dist/quill.snow.css"></link>
         <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"></link>
      </head>
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
