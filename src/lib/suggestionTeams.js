// Suggestion team names shown in the student dropdown, and the mapping
// from each team to the executive posts (head + assistant) that should
// see those suggestions on their portal.

export const SUGGESTION_TEAMS = [
  'General',
  'Chaplaincy',
  'Sports',
  'Editorial',
  'Community Development',
  'Public Relations',
  '100 Level Representative',
  'Academic',
  'Social',
  'Welfare',
  '200 Level Representative',
  'Finance',
];

// "General" is a broadcast — every executive sees it, so it maps to an
// empty array and is handled specially by execSeesSuggestion.
export const TEAM_TO_POSTS = {
  'General': [],
  'Chaplaincy': ['Chaplain'],
  'Sports': ['Sports Coordinator Male', 'Sports Coordinator Female'],
  'Editorial': ['Editor in Chief', 'Assistant Editor in Chief'],
  'Community Development': ['Community Development Officer', 'Assistant Community Development Officer'],
  'Public Relations': ['PRO', 'Assistant PRO'],
  '100 Level Representative': ['100 Level Rep'],
  'Academic': ['Academic Director', 'Assistant Academic Director'],
  'Social': ['Social Director', 'Assistant Social Director'],
  'Welfare': ['Welfare Director', 'Assistant Welfare Director'],
  '200 Level Representative': ['200 Level Rep'],
  'Finance': ['Financial Secretary', 'Assistant Financial Secretary'],
};

// Returns true if an executive with the given post should see a suggestion
// for the given team.
export function execSeesSuggestion(post, team) {
  if (!team) return false;
  if (team === 'General') return true;
  const posts = TEAM_TO_POSTS[team];
  return Array.isArray(posts) && posts.includes(post);
}