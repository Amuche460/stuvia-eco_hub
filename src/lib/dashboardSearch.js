export function levelFromSearch(value = '') {
  return value.trim().match(/^(?:level\s*)?([1-4]00)\s*(?:l|level)?(?:\s+students?)?$/i)?.[1] || '';
}

export function dashboardSearch(search, selectedLevel) {
  const searchedLevel = levelFromSearch(search);
  return {
    level: searchedLevel || selectedLevel,
    search: searchedLevel ? '' : search.trim(),
  };
}