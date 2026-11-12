import "./globals.css";

export const metadata = {
  title: "Instituto Privado Salvador Moncada",
  description: "Academic Records Management Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/styles/project-large.css" />
        <link rel="stylesheet" href="/styles/project-mobile.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
