import "./globals.css";

export const metadata = {
  title: "Lunaria Player Portal",
    description: "Official fantasy roleplay player portal for Lunaria"
    };

    export default function RootLayout({ children }) {
      return (
          <html lang="id">
                <body>{children}</body>
                    </html>
                      );
                      }