/**
 * Dime — family alert escalation on top of the Matrix messenger integration.
 * Implements EARS NOT-4 (alert vs chat classes), NOT-5 (acknowledgement fed
 * back to her, spoken + event), NOT-6/7 (timed re-notification escalation).
 *
 * How it works (zero extra config for cells):
 *  - Any grid cell whose Matrix action message starts with ALERT_PREFIX ("🔴")
 *    is treated as an ALERT. When it is sent, escalation tracking starts.
 *  - Any message from another family member in that room afterwards counts as
 *    an acknowledgement: timers stop and she hears who saw it.
 *  - If nobody responds within ackMinutes, the alert is re-sent with an
 *    escalation prefix; after escalation2Minutes, once more with max urgency.
 *    Escalation messages are self-ignored (no tracking loops).
 *
 * Limits (documented, MVP): timers live in the running app — if the tablet
 * app is killed mid-alert, escalation stops (the original alert was already
 * delivered to the family room). Config via localStorage key DIME_ALERT_CONFIG_V1:
 *   { "ackMinutes": 5, "escalation2Minutes": 10, "enabled": true }
 */
import { matrixService } from '../service/matrixMessenger/matrixService.js';
import { speechService } from '../service/speechService.js';

let alertService = {};

let ALERT_PREFIX = '🔴';
let ESCALATION_PREFIX = '⚠️';
let CONFIG_KEY = 'DIME_ALERT_CONFIG_V1';
let EVENT_ALERT_ACK = 'dime-alert-ack';
let EVENT_ALERT_ESCALATED = 'dime-alert-escalated';

let _initialized = false;
let _ownUserId = null;
let _active = null; // { roomId, text, timestamp, timer1, timer2, escalationCount }

alertService.EVENT_ALERT_ACK = EVENT_ALERT_ACK;
alertService.EVENT_ALERT_ESCALATED = EVENT_ALERT_ESCALATED;
alertService.ALERT_PREFIX = ALERT_PREFIX;

alertService.getConfig = function () {
    let defaults = { ackMinutes: 5, escalation2Minutes: 10, enabled: true };
    try {
        let raw = window.localStorage.getItem(CONFIG_KEY);
        return raw ? Object.assign(defaults, JSON.parse(raw)) : defaults;
    } catch (e) {
        return defaults;
    }
};

alertService.init = function () {
    if (_initialized) {
        return;
    }
    _initialized = true;
    matrixService.setDimeMessageListener(onMatrixMessage);
};

/** current alert state (for UI); null if no alert pending */
alertService.getActiveAlert = function () {
    if (!_active) {
        return null;
    }
    return { roomId: _active.roomId, text: _active.text, escalationCount: _active.escalationCount };
};

alertService.cancel = function () {
    clearTimers();
    _active = null;
};

async function onMatrixMessage(message) {
    if (!alertService.getConfig().enabled || !message || !message.textContent) {
        return;
    }
    if (!_ownUserId) {
        try {
            _ownUserId = await matrixService.getUsername(true);
        } catch (e) {
            // matrix not ready — ignore
        }
    }
    let isOwn = _ownUserId && message.senderId === _ownUserId;
    let body = message.textContent;

    if (isOwn && body.startsWith(ALERT_PREFIX) && !body.startsWith(ESCALATION_PREFIX)) {
        // she (this device/account) sent an alert -> start escalation tracking
        startTracking(message.roomId, body, message.timestamp || Date.now());
        return;
    }
    if (!isOwn && _active && message.roomId === _active.roomId) {
        // any family reply after an active alert counts as acknowledgement (NOT-5)
        acknowledge(message.sender);
    }
}

function startTracking(roomId, text, timestamp) {
    clearTimers();
    let config = alertService.getConfig();
    _active = { roomId: roomId, text: text, timestamp: timestamp, escalationCount: 0 };
    _active.timer1 = setTimeout(() => escalate(1), minutesToMs(config.ackMinutes));
    _active.timer2 = setTimeout(() => escalate(2), minutesToMs(config.escalation2Minutes));
}

function escalate(stage) {
    if (!_active) {
        return;
    }
    _active.escalationCount = stage;
    let msg =
        stage === 1
            ? `${ESCALATION_PREFIX} SIN RESPUESTA: ${_active.text} — por favor respondan`
            : `${ESCALATION_PREFIX}${ESCALATION_PREFIX} URGENTE, NADIE HA RESPONDIDO: ${_active.text} — llamen o vengan YA`;
    matrixService.sendMessage(_active.roomId, msg).catch((e) => console.warn('dime escalation send failed', e));
    triggerEvent(EVENT_ALERT_ESCALATED, { stage: stage });
    if (stage >= 2) {
        // final stage sent; keep listening for ack but no further sends (no spam loops)
        _active.timer1 = null;
        _active.timer2 = null;
    }
}

function acknowledge(senderName) {
    clearTimers();
    let name = senderName || 'Alguien';
    _active = null;
    // NOT-5: she hears who saw it — audio is her channel
    try {
        speechService.speak(`${name} ya vio tu mensaje.`, { lang: 'es' });
    } catch (e) {
        // never let feedback break messaging
    }
    triggerEvent(EVENT_ALERT_ACK, { sender: name });
}

function clearTimers() {
    if (_active) {
        if (_active.timer1) clearTimeout(_active.timer1);
        if (_active.timer2) clearTimeout(_active.timer2);
    }
}

function minutesToMs(min) {
    return Math.max(1, Number(min) || 5) * 60 * 1000;
}

function triggerEvent(name, detail) {
    try {
        document.dispatchEvent(new CustomEvent(name, { detail: detail }));
    } catch (e) {
        // non-browser env (tests) — ignore
    }
}

// exported for unit tests
alertService._test = { onMatrixMessage, setOwnUserId: (id) => (_ownUserId = id) };

export { alertService };
