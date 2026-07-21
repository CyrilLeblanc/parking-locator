export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-[#3b373f] p-8 text-center text-white">
      <h1 className="text-xl font-semibold">Hors ligne</h1>
      <p className="max-w-sm text-sm text-white/70">
        Vous n&rsquo;êtes pas connecté à Internet. Les tuiles de carte déjà
        consultées restent affichées&nbsp;; rechargez la page une fois la
        connexion rétablie.
      </p>
    </main>
  );
}
