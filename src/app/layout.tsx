import type { Metadata } from "next";
import { Arimo } from "next/font/google";
import "./globals.css";
import Header from "@/app/_layout/Header";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { SERVICE_NAME } from "@/constants";

const arimo = Arimo({ subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
  title: SERVICE_NAME,
  description: "Convert your media files",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${arimo.className} h-full`}>
        <Header />
        <main className={`bg-base-100 h-full`}>{children}</main>
        <ToastContainer />
      </body>
    </html>
  );
}
