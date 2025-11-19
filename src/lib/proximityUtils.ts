interface Establishment {
  neighborhood: string | null;
  city: string;
}

interface UserLocation {
  neighborhood: string;
  city: string;
}

export type ProximityLevel = "muito perto" | "perto" | "distante";

export function calcularProximidade(
  empresa: Establishment,
  localizacao_usuario: UserLocation | null
): ProximityLevel {
  if (!localizacao_usuario) return "distante";

  const empresaBairro = empresa.neighborhood?.toLowerCase().trim();
  const usuarioBairro = localizacao_usuario.neighborhood.toLowerCase().trim();
  const empresaCidade = empresa.city.toLowerCase().trim();
  const usuarioCidade = localizacao_usuario.city.toLowerCase().trim();

  // Mesmo bairro e cidade
  if (empresaBairro === usuarioBairro && empresaCidade === usuarioCidade) {
    return "muito perto";
  }

  // Mesma cidade
  if (empresaCidade === usuarioCidade) {
    return "perto";
  }

  // Cidade diferente
  return "distante";
}

export function getProximityColor(proximity: ProximityLevel): string {
  switch (proximity) {
    case "muito perto":
      return "text-green-600 dark:text-green-400";
    case "perto":
      return "text-yellow-600 dark:text-yellow-400";
    case "distante":
      return "text-gray-500 dark:text-gray-400";
  }
}

export function getProximityIcon(proximity: ProximityLevel): string {
  switch (proximity) {
    case "muito perto":
      return "🟢";
    case "perto":
      return "🟡";
    case "distante":
      return "⚪";
  }
}
