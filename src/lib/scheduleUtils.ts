// Utilitário para verificar se estabelecimento está aberto

export function isOpenNow(schedule: string): boolean {
  try {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Domingo, 1 = Segunda, etc.
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // Formato esperado: "Seg-Sex: 08:00-18:00, Sáb: 08:00-12:00"
    const scheduleLines = schedule.split(',').map(s => s.trim());

    for (const line of scheduleLines) {
      const [days, hours] = line.split(':').map(s => s.trim());
      if (!hours) continue;

      const [openTime, closeTime] = hours.split('-').map(s => s.trim());
      
      // Verifica se o dia atual está incluído
      if (isDayIncluded(days, currentDay)) {
        const openMinutes = timeToMinutes(openTime);
        const closeMinutes = timeToMinutes(closeTime);
        
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
  const daysMap: Record<string, number> = {
    'dom': 0, 'domingo': 0,
    'seg': 1, 'segunda': 1,
    'ter': 2, 'terça': 2, 'terca': 2,
    'qua': 3, 'quarta': 3,
    'qui': 4, 'quinta': 4,
    'sex': 5, 'sexta': 5,
    'sáb': 6, 'sab': 6, 'sábado': 6, 'sabado': 6
  };

  const lowerDays = daysStr.toLowerCase();

  // Verifica se é um range (ex: seg-sex)
  if (lowerDays.includes('-')) {
    const [start, end] = lowerDays.split('-').map(s => s.trim());
    const startDay = daysMap[start];
    const endDay = daysMap[end];
    
    if (startDay !== undefined && endDay !== undefined) {
      if (startDay <= endDay) {
        return currentDay >= startDay && currentDay <= endDay;
      } else {
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
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

export function getScheduleStatus(schedule: string): { isOpen: boolean; text: string; color: string } {
  const isOpen = isOpenNow(schedule);
  
  return {
    isOpen,
    text: isOpen ? 'Aberto agora' : 'Fechado',
    color: isOpen ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
  };
}
