import "../public/styles/project-large.css";
import "../public/styles/project-mobile.css";

export const metadata = {
  title: "Instituto Privado Salvador Moncada",
  description: "Academic Records Management Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
