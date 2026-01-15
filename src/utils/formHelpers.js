// Form helper functions

export const handleDragStart = (e, guestId, setDraggedId) => {
  setDraggedId(guestId);
  e.dataTransfer.effectAllowed = 'move';
};

export const handleDragOver = (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
};

export const handleDrop = (e, draggedId, targetId, guests, setGuests, setDraggedId) => {
  e.preventDefault();
  if (draggedId === null || draggedId === targetId) return;

  const draggedIndex = guests.findIndex(g => g.id === draggedId);
  const targetIndex = guests.findIndex(g => g.id === targetId);

  const newGuests = [...guests];
  const [draggedGuest] = newGuests.splice(draggedIndex, 1);
  newGuests.splice(targetIndex, 0, draggedGuest);

  setGuests(newGuests);
  setDraggedId(null);
};

export const handleDragEnd = (setDraggedId) => {
  setDraggedId(null);
};

export const validateForm = (mainName, guests) => {
  if (!mainName.trim()) {
    return {
      isValid: false,
      error: 'Por favor, preencha o nome',
    };
  }

  const invalidGuests = guests.filter(g => !g.name.trim() || !g.plate);
  if (invalidGuests.length > 0) {
    return {
      isValid: false,
      error: 'Por favor, preencha o nome e escolha um prato para cada convidados',
    };
  }

  return { isValid: true };
};
