// Utilitário para verificar se estabelecimento está aberto
// CORRIGIDO: Lógica confiável para todos os cenários incluindo madrugada

export function isOpenNow(schedule: string): boolean {
  if (!schedule || typeof schedule !== 'string') {
    return false;
  }

  try {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Domingo, 1 = Segunda, etc.
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = currentHours * 60 + currentMinutes;

    // Formato esperado: "Seg-Sex: 08:00-18:00, Sáb: 08:00-12:00"
    const scheduleLines = schedule.split(',').map(s => s.trim());

    for (const line of scheduleLines) {
      // Ignorar linhas vazias
      if (!line) continue;
      
      // Procurar padrões como "fechado", "não abre", etc.
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('fechado') || lowerLine.includes('não abre') || lowerLine.includes('nao abre')) {
        // Verificar se o dia atual está incluído nesta linha de "fechado"
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const days = line.substring(0, colonIndex).trim();
          if (isDayIncluded(days, currentDay)) {
            return false; // Fechado neste dia
          }
        }
        continue;
      }

      // Dividir por ":" mas apenas no primeiro para pegar dias e horário
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;
      
      const days = line.substring(0, colonIndex).trim();
      const hours = line.substring(colonIndex + 1).trim();
      
      if (!hours || !days) continue;

      // Pular se não tiver horário válido (ex: "fechado")
      if (!hours.includes('-') && !hours.match(/\d/)) continue;

      // Extrair horários - suporta formatos como "08:00-18:00", "8h-18h", "08:00-18h"
      const hoursMatch = hours.match(/(\d{1,2}):?(\d{2})?\s*[-–]\s*(\d{1,2}):?(\d{2})?/);
      if (!hoursMatch) continue;

      const openHour = parseInt(hoursMatch[1], 10);
      const openMin = parseInt(hoursMatch[2] || '0', 10);
      const closeHour = parseInt(hoursMatch[3], 10);
      const closeMin = parseInt(hoursMatch[4] || '0', 10);

      const openMinutes = openHour * 60 + openMin;
      const closeMinutes = closeHour * 60 + closeMin;
      
      // Verifica se o dia atual está incluído
      if (!isDayIncluded(days, currentDay)) continue;

      // CORREÇÃO: Tratamento de horários que passam da meia-noite
      // Ex: 18:00-02:00 (fecha às 2h da manhã do dia seguinte)
      if (closeMinutes < openMinutes) {
        // Horário atravessa meia-noite
        // Se estamos entre abertura e meia-noite OU entre meia-noite e fechamento
        if (currentTime >= openMinutes || currentTime < closeMinutes) {
          return true;
        }
        
        // Verificar também se o dia anterior tinha horário que atravessa
        const previousDay = currentDay === 0 ? 6 : currentDay - 1;
        if (isDayIncluded(days, previousDay) && currentTime < closeMinutes) {
          return true;
        }
      } else {
        // Horário normal (não atravessa meia-noite)
        if (currentTime >= openMinutes && currentTime < closeMinutes) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Error parsing schedule:', error);
    return false;
  }
}

function isDayIncluded(daysStr: string, targetDay: number): boolean {
  if (!daysStr || typeof daysStr !== 'string') {
    return false;
  }

  const daysMap: Record<string, number> = {
    'dom': 0, 'domingo': 0, 'sun': 0,
    'seg': 1, 'segunda': 1, 'mon': 1, '2ª': 1, '2a': 1,
    'ter': 2, 'terça': 2, 'terca': 2, 'tue': 2, '3ª': 2, '3a': 2,
    'qua': 3, 'quarta': 3, 'wed': 3, '4ª': 3, '4a': 3,
    'qui': 4, 'quinta': 4, 'thu': 4, '5ª': 4, '5a': 4,
    'sex': 5, 'sexta': 5, 'fri': 5, '6ª': 5, '6a': 5,
    'sáb': 6, 'sab': 6, 'sábado': 6, 'sabado': 6, 'sat': 6,
  };

  const lowerDays = daysStr.toLowerCase().trim();

  // Verifica padrões como "todos os dias", "diariamente", "24h"
  if (lowerDays.includes('todos') || lowerDays.includes('diariamente') || lowerDays.includes('24h') || lowerDays.includes('24 h')) {
    return true;
  }

  // Verifica se é um range (ex: seg-sex, seg-dom, ter-sab)
  const rangeMatch = lowerDays.match(/(\w+)\s*[-–a]\s*(\w+)/);
  if (rangeMatch) {
    const startKey = rangeMatch[1].toLowerCase();
    const endKey = rangeMatch[2].toLowerCase();
    const startDay = daysMap[startKey];
    const endDay = daysMap[endKey];
    
    if (startDay !== undefined && endDay !== undefined) {
      if (startDay <= endDay) {
        return targetDay >= startDay && targetDay <= endDay;
      } else {
        // Wrap around (ex: sex-seg = sexta, sábado, domingo, segunda)
        return targetDay >= startDay || targetDay <= endDay;
      }
    }
  }

  // Verifica múltiplos dias separados por vírgula, espaço ou "e"
  const daysList = lowerDays.split(/[\s,e]+/);
  for (const day of daysList) {
    const cleanDay = day.trim();
    if (daysMap[cleanDay] === targetDay) {
      return true;
    }
  }

  // Verifica se é um dia específico
  for (const [key, value] of Object.entries(daysMap)) {
    if (lowerDays.includes(key) && value === targetDay) {
      return true;
    }
  }

  return false;
}

export function getScheduleStatus(schedule: string): { isOpen: boolean; text: string; color: string } {
  if (!schedule || typeof schedule !== 'string') {
    return {
      isOpen: false,
      text: 'Horário não informado',
      color: 'text-muted-foreground'
    };
  }

  const isOpen = isOpenNow(schedule);
  
  return {
    isOpen,
    text: isOpen ? 'Aberto agora' : 'Fechado',
    color: isOpen ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
  };
}

// Função para ordenar estabelecimentos: ABERTOS primeiro, FECHADOS depois
export function sortByOpenStatus<T extends { schedule: string }>(
  items: T[],
  secondarySort?: (a: T, b: T) => number
): T[] {
  return [...items].sort((a, b) => {
    const aOpen = isOpenNow(a.schedule);
    const bOpen = isOpenNow(b.schedule);
    
    // Abertos vêm primeiro
    if (aOpen && !bOpen) return -1;
    if (!aOpen && bOpen) return 1;
    
    // Se ambos têm mesmo status, usar ordenação secundária
    if (secondarySort) {
      return secondarySort(a, b);
    }
    
    return 0;
  });
}
