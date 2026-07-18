/**
 * Dime practice module — progress storage + progression logic.
 *
 * Implements the diminishing-cue ladder (EARS PRX-4) and session logging
 * (PRX-8, local-only MVP; account sync is a Phase-2+ follow-up) with the
 * no-guilt frequency model (PRX-7: celebrate >=2 days/week, target 3-4).
 *
 * Storage: window.localStorage under one namespaced key. Deliberately does NOT
 * touch upstream data models (REL-4: keep the fork additive/rebase-friendly).
 *
 * Cue levels per item (diminishing support):
 *   0 = full support: picture + word + auto audio model ("escucha y repite")
 *   1 = medium: picture + first syllable cue, audio on demand
 *   2 = minimal: picture only, word hidden until reveal
 * Advancement: ADVANCE_STREAK consecutive successes at current level.
 * A "casi" (almost) resets the streak but never lowers the level automatically.
 */

let practiceService = {};

let KEY = 'DIME_PRACTICE_V1';
let ADVANCE_STREAK = 3;
let MAX_CUE_LEVEL = 2;

function load() {
    try {
        let raw = window.localStorage.getItem(KEY);
        let data = raw ? JSON.parse(raw) : null;
        if (data && typeof data === 'object') {
            data.items = data.items || {};
            data.sessions = data.sessions || [];
            return data;
        }
    } catch (e) {
        // corrupted storage — start fresh rather than crash (REL-1 spirit)
    }
    return { items: {}, sessions: [] };
}

function save(data) {
    try {
        window.localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
        // storage full/unavailable: practice must keep working (GEN-2)
    }
}

function itemState(data, itemId) {
    if (!data.items[itemId]) {
        data.items[itemId] = { cueLevel: 0, streak: 0, successes: 0, attempts: 0 };
    }
    return data.items[itemId];
}

practiceService.getItemState = function (itemId) {
    return itemState(load(), itemId);
};

/**
 * records an attempt for an item.
 * @param itemId
 * @param result 'success' | 'almost' | 'skip'
 * @return {object} updated state incl. .advanced (true if cue level just went up)
 */
practiceService.recordAttempt = function (itemId, result) {
    let data = load();
    let state = itemState(data, itemId);
    state.advanced = false;
    if (result === 'skip') {
        save(data);
        return state;
    }
    state.attempts++;
    if (result === 'success') {
        state.successes++;
        state.streak++;
        if (state.streak >= ADVANCE_STREAK && state.cueLevel < MAX_CUE_LEVEL) {
            state.cueLevel++;
            state.streak = 0;
            state.advanced = true;
        }
    } else {
        state.streak = 0;
    }
    save(data);
    return state;
};

/** true if item consistently succeeds at minimal cues (candidate for real-life use, PRX-10) */
practiceService.isMastered = function (itemId) {
    let s = practiceService.getItemState(itemId);
    return s.cueLevel >= MAX_CUE_LEVEL && s.successes >= ADVANCE_STREAK * (MAX_CUE_LEVEL + 1);
};

practiceService.logSession = function (levelId, durationMs, itemsPracticed, successes) {
    let data = load();
    data.sessions.push({
        date: new Date().toISOString(),
        level: levelId,
        durationMs: durationMs,
        items: itemsPracticed,
        successes: successes
    });
    // keep last 500 sessions
    if (data.sessions.length > 500) {
        data.sessions = data.sessions.slice(-500);
    }
    save(data);
};

/** distinct practice days in the last 7 calendar days (incl. today) */
practiceService.getPracticeDaysThisWeek = function () {
    let data = load();
    let days = new Set();
    let now = Date.now();
    let weekMs = 7 * 24 * 60 * 60 * 1000;
    for (let s of data.sessions) {
        let t = Date.parse(s.date);
        if (!isNaN(t) && now - t < weekMs) {
            days.add(new Date(t).toDateString());
        }
    }
    return days.size;
};

practiceService.getSessions = function () {
    return load().sessions;
};

/** encouraging, never guilt-inducing (PRX-7) */
practiceService.getWeekMessage = function () {
    let days = practiceService.getPracticeDaysThisWeek();
    if (days >= 4) return '¡Increíble! ' + days + ' días esta semana. 🌟';
    if (days >= 2) return '¡Muy bien! ' + days + ' días esta semana. 💪';
    if (days === 1) return '¡Buen comienzo esta semana! 🌱';
    return '¡Hoy es un buen día para practicar! ☀️';
};

practiceService.getExportData = function () {
    return load();
};

/**
 * merges two practice datasets without losing history (EARS CFG-7: never lose
 * her recorded practice history). Pure function — unit-tested.
 * Items: per-item maximum of cueLevel/successes/attempts (progress never lost).
 * Sessions: union, deduplicated by (date, level, durationMs).
 */
practiceService.mergeData = function (a, b) {
    a = a && typeof a === 'object' ? a : { items: {}, sessions: [] };
    b = b && typeof b === 'object' ? b : { items: {}, sessions: [] };
    let merged = { items: {}, sessions: [] };
    let itemIds = new Set([...Object.keys(a.items || {}), ...Object.keys(b.items || {})]);
    for (let id of itemIds) {
        let ia = (a.items || {})[id] || {};
        let ib = (b.items || {})[id] || {};
        merged.items[id] = {
            cueLevel: Math.max(ia.cueLevel || 0, ib.cueLevel || 0),
            streak: Math.max(ia.streak || 0, ib.streak || 0),
            successes: Math.max(ia.successes || 0, ib.successes || 0),
            attempts: Math.max(ia.attempts || 0, ib.attempts || 0)
        };
    }
    let seen = new Set();
    for (let s of [...(a.sessions || []), ...(b.sessions || [])]) {
        let key = `${s.date}|${s.level}|${s.durationMs}`;
        if (!seen.has(key)) {
            seen.add(key);
            merged.sessions.push(s);
        }
    }
    merged.sessions.sort((x, y) => String(x.date).localeCompare(String(y.date)));
    if (merged.sessions.length > 500) {
        merged.sessions = merged.sessions.slice(-500);
    }
    return merged;
};

/** replaces local storage with given data (used after merging with account data) */
practiceService.importData = function (data) {
    save(practiceService.mergeData(load(), data));
};

export { practiceService };
