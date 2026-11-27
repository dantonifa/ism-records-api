"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./Navbar.css";

const NAV_GROUPS = [
  {
    id: "school",
    label: "SCHOOL",
    items: [
      { label: "Discover", href: "/discover.html", externalStatic: true },
      { label: "Register", href: "/register.html", externalStatic: true },
      { label: "Request Account", href: "/request-account" },
    ],
  },
  {
    id: "academics",
    label: "ACADEMICS",
    items: [
      { label: "Students", href: "/students" },
      { label: "Courses", href: "/courses" },
      { label: "Enrollments", href: "/enrollments" },
    ],
  },
  {
    id: "grades-records",
    label: "GRADES & RECORDS",
    items: [
      { label: "Records", href: "/records.html", externalStatic: true },
      { label: "Grades", href: "/grades" },
      { label: "Review Grades", href: "/review-grades" },
    ],
  },
  {
    id: "account",
    label: "ACCOUNT",
    items: [
      { label: "Admin", href: "/admin" },
      { label: "Sign In", href: "/api/auth/signin", externalStatic: true },
    ],
  },
];

export default function Navbar({ user = null, onSignOut = null }) {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navRef = useRef(null);
  const triggerRefs = useRef({});

  // Close menus whenever the route changes
  useEffect(() => {
    setOpenDropdown(null);
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setOpenDropdown(null);
        setMobileMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        const previousOpen = openDropdown;
        setOpenDropdown(null);
        setMobileMenuOpen(false);
        if (previousOpen && triggerRefs.current[previousOpen]) {
          triggerRefs.current[previousOpen].focus();
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openDropdown]);

  const toggleDropdown = (id) => {
    setOpenDropdown((prev) => (prev === id ? null : id));
  };

  return (
    <nav
      ref={navRef}
      id="nav-container"
      className="ism-navbar"
      aria-label="Primary Navigation"
    >
      <button
        type="button"
        id="menu"
        className="ism-mobile-toggle"
        aria-expanded={mobileMenuOpen}
        aria-controls="ism-nav-list"
        aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        onClick={() => setMobileMenuOpen((prev) => !prev)}
      >
        <span className="ism-hamburger-icon" aria-hidden="true">
          {mobileMenuOpen ? "✕" : "☰"}
        </span>
      </button>

      <ul
        id="ism-nav-list"
        className={`ism-nav-list ${mobileMenuOpen ? "is-open" : ""}`}
      >
        {/* Direct Home Link */}
        <li className="ism-nav-item">
          <Link
            href="/"
            className={`ism-nav-link ${pathname === "/" ? "is-active" : ""}`}
            aria-current={pathname === "/" ? "page" : undefined}
          >
            HOME
          </Link>
        </li>

        {/* Grouped Dropdown Folders */}
        {NAV_GROUPS.map((group) => {
          const isOpen = openDropdown === group.id;
          const hasActiveChild = group.items.some((item) => pathname === item.href);

          return (
            <li
              key={group.id}
              className={`ism-nav-item ism-dropdown ${isOpen ? "is-open" : ""}`}
              onMouseEnter={() => {
                if (window.innerWidth > 820) setOpenDropdown(group.id);
              }}
              onMouseLeave={() => {
                if (window.innerWidth > 820) setOpenDropdown(null);
              }}
            >
              <button
                ref={(el) => {
                  triggerRefs.current[group.id] = el;
                }}
                type="button"
                className={`ism-dropdown-trigger ${hasActiveChild ? "is-active" : ""}`}
                aria-expanded={isOpen}
                aria-haspopup="true"
                aria-controls={`dropdown-${group.id}`}
                onClick={() => toggleDropdown(group.id)}
              >
                <span>{group.label}</span>
                <span className="ism-chevron" aria-hidden="true">
                  ▾
                </span>
              </button>

              <ul
                id={`dropdown-${group.id}`}
                className="ism-dropdown-menu"
                hidden={!isOpen}
              >
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href} className="ism-dropdown-item">
                      {item.externalStatic ? (
                        <a
                          href={item.href}
                          className={`ism-dropdown-link ${isActive ? "is-active" : ""}`}
                          onClick={() => {
                            setOpenDropdown(null);
                            setMobileMenuOpen(false);
                          }}
                        >
                          {item.label}
                        </a>
                      ) : (
                        <Link
                          href={item.href}
                          className={`ism-dropdown-link ${isActive ? "is-active" : ""}`}
                          aria-current={isActive ? "page" : undefined}
                          onClick={() => {
                            setOpenDropdown(null);
                            setMobileMenuOpen(false);
                          }}
                        >
                          {item.label}
                        </Link>
                      )}
                    </li>
                  );
                })}

                {/* Sign Out action inside Account folder */}
                {group.id === "account" && (
                  <li className="ism-dropdown-item ism-dropdown-divider">
                    {onSignOut ? (
                      <button
                        type="button"
                        className="ism-dropdown-link ism-signout-btn"
                        onClick={() => {
                          setOpenDropdown(null);
                          setMobileMenuOpen(false);
                          onSignOut();
                        }}
                      >
                        Sign Out{user?.name ? ` (${user.name})` : ""}
                      </button>
                    ) : (
                      <Link
                        href="/api/auth/signout"
                        className="ism-dropdown-link ism-signout-btn"
                      >
                        Sign Out
                      </Link>
                    )}
                  </li>
                )}
              </ul>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}