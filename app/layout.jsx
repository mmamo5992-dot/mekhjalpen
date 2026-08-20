import "./globals.css";

export const metadata = {
  title: "MekHjälpen",
  description: "Digital servicebok för din bil",
};

export default function RootLayout({ children }) {
  return (
    <html lang="sv">
      <body className="bg-[#14181C] text-[#EDEFF2] min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}