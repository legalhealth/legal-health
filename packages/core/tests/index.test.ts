import { describe, expect, it } from 'vitest';
import { CORE_PACKAGE } from '../src/index';

// Teste de fumaça do esqueleto: garante que o pacote resolve e compila.
// Os golden cases T-01..T-15 (Anexo I §3) entram na Sprint 1, junto do motor.
describe('@lh/core (esqueleto S0-B)', () => {
  it('expõe o marcador do pacote', () => {
    expect(CORE_PACKAGE).toBe('@lh/core');
  });
});
