// Utilitário para verificar se estabelecimento está aberto

export function isOpenNow(schedule: string): boolean {
  if (!schedule || typeof schedule !== 'string') {
    return false;
  }

  try {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Domingo, 1 = Segunda, etc.
    const currentTime = now.getHours() * 60 + now.getMinutes();

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
      if (isDayIncluded(days, currentDay)) {
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

function isDayIncluded(daysStr: string, currentDay: number): boolean {
  if (!daysStr || typeof daysStr !== 'string') {
    return false;
  }

  const daysMap: Record<string, number> = {
    'dom': 0, 'domingo': 0,
    'seg': 1, 'segunda': 1,
    'ter': 2, 'terça': 2, 'terca': 2,
    'qua': 3, 'quarta': 3,
    'qui': 4, 'quinta': 4,
    'sex': 5, 'sexta': 5,
    'sáb': 6, 'sab': 6, 'sábado': 6, 'sabado': 6
  };

  const lowerDays = daysStr.toLowerCase().trim();

  // Verifica se é um range (ex: seg-sex, seg-dom)
  const rangeMatch = lowerDays.match(/(\w+)\s*[-–]\s*(\w+)/);
  if (rangeMatch) {
    const startDay = daysMap[rangeMatch[1]];
    const endDay = daysMap[rangeMatch[2]];
    
    if (startDay !== undefined && endDay !== undefined) {
      if (startDay <= endDay) {
        return currentDay >= startDay && currentDay <= endDay;
      } else {
        // Wrap around (ex: sex-seg = sexta, sábado, domingo, segunda)
        return currentDay >= startDay || currentDay <= endDay;
      }
    }
  }

  // Verifica se é um dia específico
  for (const [key, value] of Object.entries(daysMap)) {
    if (lowerDays.includes(key) && value === currentDay) {
      return true;
    }
  }

  return false;
}

function timeToMinutes(timeStr: string): number {
  if (!timeStr || typeof timeStr !== 'string') {
    return 0;
  }
  const parts = timeStr.replace(/h/gi, '').split(':').map(s => parseInt(s.trim(), 10) || 0);
  const hours = parts[0] || 0;
  const minutes = parts[1] || 0;
  return hours * 60 + minutes;
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
