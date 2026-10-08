/**
 * Automatic level promotion utility.
 *
 * The academic year starts in September and ends in July the following year.
 * A student who registered as 100 level in October 2026 becomes 200 level
 * in September 2027, 300 level in September 2028, etc.
 *
 * The promotion is driven by `registration_level` (the level at first
 * registration) and `created_date` (when the record was created).  If
 * `registration_level` is missing (legacy records) we fall back to the
 * stored `level`, which is correct since no promotions have run yet.
 */

/**
 * Returns the calendar year in which the academic year containing `date`
 * started.  Academic year starts in September; August is treated as part
 * of the upcoming year.
 *
 * @param {Date|string} date
 * @returns {number}
 */
export function getAcademicYearStart(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-12
  return month >= 8 ? year : year - 1;
}

/**
 * Computes the level a student should be at right now.
 *
 * @param {string|number} registrationLevel  Level at registration (100-400)
 * @param {Date|string} createdDate          When the student registered
 * @returns {string} The current level as a string ("100"-"400")
 */
export function computeCurrentLevel(registrationLevel, createdDate) {
  const regLevel = parseInt(registrationLevel, 10) || 100;
  const regYear = getAcademicYearStart(createdDate);
  const currentYear = getAcademicYearStart(new Date());
  const yearsPassed = Math.max(0, currentYear - regYear);
  return String(Math.min(regLevel + yearsPassed * 100, 400));
}

/**
 * Checks whether a student's stored level matches what it should be.
 *
 * @param {Object} student  Student entity record
 * @returns {{ needsUpdate: boolean, correctLevel: string|null }}
 */
export function checkStudentLevel(student) {
  if (!student) return { needsUpdate: false, correctLevel: null };
  const regLevel = student.registration_level || student.level;
  const correctLevel = computeCurrentLevel(regLevel, student.created_date);
  const needsUpdate = String(student.level) !== correctLevel;
  return { needsUpdate, correctLevel };
}