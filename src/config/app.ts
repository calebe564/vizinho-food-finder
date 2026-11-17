// Configurações da região atendida pelo app (antes estavam espalhadas pelo código).
// Para atender outra região, troque aqui.

export const APP_CONFIG = {
  /** Cidade e região principais. */
  city: "Belo Horizonte",
  region: "Barreiro",
  /** Ponto usado quando o navegador não libera a localização do usuário. */
  defaultCoordinates: { latitude: -19.9833, longitude: -44.0333 },
  /** Exemplo mostrado no campo de busca de localização. */
  locationPlaceholder: "Ex: Vila Pinho, Barreiro",
} as const;
