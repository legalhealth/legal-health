/**
 * Superfície mínima do runtime Deno usada pelo entrypoint.
 *
 * O gateway executa como Supabase Edge Function (ADR-0004 D4.4), cujo runtime é o Deno.
 * Declarar aqui as duas APIs efetivamente utilizadas mantém `tsc --noEmit` verde sem
 * introduzir dependência externa nova — o que exigiria ADR (Playbook §15.1).
 */

declare const Deno: {
  serve(handler: (request: Request) => Promise<Response>): unknown;
  readonly env: { get(key: string): string | undefined };
};
