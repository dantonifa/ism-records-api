"use client";

import { useState } from "react";
import Link from "next/link";
import SignOutButton from "./SignOutButton";

export default function HomeNavigation() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        id="menu"
        className={open ? "open" : ""}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="nav-container"
        onClick={() => setOpen(!open)}
      />
      <nav id="nav-container" className={open ? "is-open" : ""} aria-label="Main navigation">
        <ul>
          <li><Link href="/">HOME</Link></li>
          <li><a href="/discover.html">DISCOVER</a></li>
          <li><a href="/register.html">REGISTER</a></li>
          <li><a href="/records.html">RECORDS</a></li>
          <li><Link href="/students">STUDENTS</Link></li>
          <li><Link href="/courses">COURSES</Link></li>
          <li><Link href="/enrollments">ENROLLMENTS</Link></li>
          <li><Link href="/login">SIGN IN</Link></li>
          <li><Link href="/signup">REQUEST ACCOUNT</Link></li>
          <li><Link href="/grades/entry">GRADES</Link></li>
          <li><Link href="/grades/review">REVIEW GRADES</Link></li>
          <li><Link href="/account">ACCOUNT</Link></li>
          <li><Link href="/admin">ADMIN</Link></li>
          <li><SignOutButton /></li>
        </ul>
      </nav>
    </>
  );
}
