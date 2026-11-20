// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { EstablishmentMap } from './EstablishmentMap';

afterEach(() => cleanup());

const base = { name: 'Padaria do Zé', address: 'Rua A, 10, Barreiro, Belo Horizonte' };

describe('EstablishmentMap', () => {
  it('mostra o endereço e a referência', () => {
    render(<EstablishmentMap {...base} referencePoint="Perto da praça" latitude={-19.98} longitude={-44.03} />);
    expect(screen.getByText(base.address)).toBeTruthy();
    expect(screen.getByText('Referência: Perto da praça')).toBeTruthy();
  });

  it('o mapa só carrega quando a pessoa pede', () => {
    render(<EstablishmentMap {...base} latitude={-19.98} longitude={-44.03} />);
    expect(document.querySelector('iframe')).toBeNull();
    fireEvent.click(screen.getByText('Ver no mapa'));
    const frame = document.querySelector('iframe');
    expect(frame?.getAttribute('src')).toContain('openstreetmap.org/export/embed.html');
    expect(frame?.getAttribute('title')).toBe('Mapa da localização de Padaria do Zé');
    fireEvent.click(screen.getByText('Esconder mapa'));
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('"Como chegar" usa o link da empresa quando é seguro, senão as coordenadas', () => {
    const { rerender } = render(
      <EstablishmentMap {...base} latitude={-19.98} longitude={-44.03} googleMapsLink="https://maps.app.goo.gl/xyz" />,
    );
    expect(screen.getByText('Como chegar').closest('a')?.getAttribute('href')).toBe('https://maps.app.goo.gl/xyz');
    rerender(<EstablishmentMap {...base} latitude={-19.98} longitude={-44.03} googleMapsLink="javascript:alert(1)" />);
    expect(screen.getByText('Como chegar').closest('a')?.getAttribute('href')).toContain('google.com/maps/dir');
  });

  it('sem coordenadas válidas e sem link, não oferece mapa nem rota', () => {
    render(<EstablishmentMap {...base} latitude={0} longitude={0} googleMapsLink={null} />);
    expect(screen.queryByText('Ver no mapa')).toBeNull();
    expect(screen.queryByText('Como chegar')).toBeNull();
  });

  it('o link de rota abre em outra aba sem vazar a origem', () => {
    render(<EstablishmentMap {...base} latitude={-19.98} longitude={-44.03} />);
    const a = screen.getByText('Como chegar').closest('a');
    expect(a?.getAttribute('target')).toBe('_blank');
    expect(a?.getAttribute('rel')).toContain('noopener');
  });
});
