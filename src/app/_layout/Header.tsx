"use client";

import { SERVICE_NAME } from "@/constants";

export default function Header() {
  return <header className="navbar bg-base-100">
    <a className="btn btn-ghost normal-case text-xl">{SERVICE_NAME}</a>
  </header>;
}
