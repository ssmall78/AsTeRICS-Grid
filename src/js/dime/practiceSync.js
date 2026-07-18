/**
 * Dime — syncs practice progress through the family account (EARS PRX-8/9).
 *
 * Mechanism: progress snapshots live in the synced MetaData object
 * (metadata.dimePractice), which AsTeRICS Grid already replicates offline-first
 * across all devices of the account (PouchDB -> CouchDB). No new sync layer.
 *
 * Semantics:
 *  - Her tablet is the primary writer (after each practice session).
 *  - Any device (e.g. an FE phone opening #practica) pulls + merges on view load,
 *    so family members see her real progress once sync has run.
 *  - Merge never loses history (practiceService.mergeData: per-item max, session union).
 *  - All calls are fire-and-safe: offline or logged-out states must never break
 *    practice itself (GEN-2/REL-1) — errors are swallowed after logging.
 */
import { dataService } from '../service/data/dataService.js';
import { practiceService } from './practiceService.js';

let practiceSync = {};

/** pushes local progress into the synced metadata (call after a session ends) */
practiceSync.pushToAccount = async function () {
    try {
        let metadata = await dataService.getMetadata();
        if (!metadata) {
            return false;
        }
        let merged = practiceService.mergeData(metadata.dimePractice, practiceService.getExportData());
        metadata.dimePractice = merged;
        await dataService.saveMetadata(metadata);
        return true;
    } catch (e) {
        console.warn('dime practiceSync push failed (offline or not logged in - ok)', e);
        return false;
    }
};

/** pulls account progress into local storage (call when the practice view opens) */
practiceSync.pullFromAccount = async function () {
    try {
        let metadata = await dataService.getMetadata();
        if (metadata && metadata.dimePractice) {
            practiceService.importData(metadata.dimePractice);
            return true;
        }
        return false;
    } catch (e) {
        console.warn('dime practiceSync pull failed (offline or not logged in - ok)', e);
        return false;
    }
};

export { practiceSync };
