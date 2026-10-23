export function levelFromSearch(value = '') {
  return value.trim().match(/^(?:level\s*)?([1-4]00)\s*(?:l|level)?(?:\s+students?)?$/i)?.[1] || '';
}

export function dashboardSearch(search, levelSearch, selectedLevel) {
  const searchedLevel = levelFromSearch(search);
  return {
    level: levelSearch.trim() ? (levelFromSearch(levelSearch) || 'no-matching-level') : (searchedLevel || selectedLevel),
    search: searchedLevel ? '' : search.trim(),
  };
}