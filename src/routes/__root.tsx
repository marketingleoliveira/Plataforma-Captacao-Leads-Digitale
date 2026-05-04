import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao painel
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "IA Digitale Têxtil" },
      { name: "description", content: "Plataforma de agente virtual de qualificação de leads por voz com IA, integrada ao 3CX." },
      { property: "og:title", content: "IA Digitale Têxtil" },
      { name: "twitter:title", content: "IA Digitale Têxtil" },
      { property: "og:description", content: "Plataforma de agente virtual de qualificação de leads por voz com IA, integrada ao 3CX." },
      { name: "twitter:description", content: "Plataforma de agente virtual de qualificação de leads por voz com IA, integrada ao 3CX." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ace13dfc-3ed7-4d74-b0a7-c0cba0baf40f/id-preview-18d1f6c5--74d21155-d711-4f61-8f4b-99b8807417f2.lovable.app-1777912520671.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ace13dfc-3ed7-4d74-b0a7-c0cba0baf40f/id-preview-18d1f6c5--74d21155-d711-4f61-8f4b-99b8807417f2.lovable.app-1777912520671.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <AppLayout />;
}
