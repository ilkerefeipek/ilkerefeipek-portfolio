/**
 * data-loader.js
 * Async JSON fetcher with cache. Used by i18n.js, projects, skills, etc.
 */

const cache = new Map();

/**
 * Fetch JSON file with cache.
 * @param {string} url
 * @returns {Promise<any>}
 */
export async function loadJson(url) {
  if (cache.has(url)) return cache.get(url);
  const promise = fetch(url, { credentials: 'same-origin' }).then((r) => {
    if (!r.ok) throw new Error(`Failed to load ${url}: ${r.status}`);
    return r.json();
  });
  cache.set(url, promise);
  try {
    return await promise;
  } catch (err) {
    cache.delete(url);
    throw err;
  }
}

/** @returns {Promise<any>} content.json (i18n + links) */
export const loadContent = () => loadJson('data/content.json');

/** @returns {Promise<any[]>} */
export const loadProjects = () => loadJson('data/projects.json');

/** @returns {Promise<any[]>} */
export const loadEducation = () => loadJson('data/education.json');

/** @returns {Promise<any[]>} */
export const loadExperience = () => loadJson('data/experience.json');

/** @returns {Promise<any[]>} */
export const loadCertificates = () => loadJson('data/certificates.json');

/** @returns {Promise<any[]>} */
export const loadLanguages = () => loadJson('data/languages.json');

/**
 * Resolve a dot-notated path on an object. Returns undefined if any segment is missing.
 * @param {any} obj
 * @param {string} path
 */
export function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}
