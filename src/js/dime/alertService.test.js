/**
 * @jest-environment jsdom
 */
jest.mock('../service/matrixMessenger/matrixService.js', () => {
    return {
        matrixService: {
            sent: [],
            setDimeMessageListener: jest.fn(),
            getUsername: jest.fn().mockResolvedValue('@ella:example.org'),
            sendMessage: jest.fn(function (roomId, msg) {
                this.sent.push({ roomId, msg });
                return Promise.resolve();
            })
        }
    };
});
jest.mock('../service/speechService.js', () => {
    return {
        speechService: {
            spoken: [],
            speak: jest.fn(function (text) {
                this.spoken.push(text);
            })
        }
    };
});

import { alertService } from './alertService.js';
import { matrixService } from '../service/matrixMessenger/matrixService.js';
import { speechService } from '../service/speechService.js';

let ROOM = '!family:example.org';

function ownAlert(text) {
    return { senderId: '@ella:example.org', sender: 'Ella', roomId: ROOM, textContent: text, timestamp: Date.now() };
}
function familyReply(text, sender = 'Ana') {
    return { senderId: '@ana:example.org', sender: sender, roomId: ROOM, textContent: text, timestamp: Date.now() };
}

describe('dime alertService', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        matrixService.sent.length = 0;
        speechService.spoken.length = 0;
        alertService._test.setOwnUserId('@ella:example.org');
        alertService.cancel();
    });
    afterEach(() => {
        jest.useRealTimers();
    });

    test('own alert message starts tracking', async () => {
        await alertService._test.onMatrixMessage(ownAlert('🔴 Necesito ayuda'));
        expect(alertService.getActiveAlert()).not.toBeNull();
        expect(alertService.getActiveAlert().escalationCount).toBe(0);
    });

    test('no ack -> escalates at stage 1 and 2, then stops sending', async () => {
        await alertService._test.onMatrixMessage(ownAlert('🔴 Necesito ayuda'));
        jest.advanceTimersByTime(5 * 60 * 1000 + 10);
        expect(matrixService.sent.length).toBe(1);
        expect(matrixService.sent[0].msg).toContain('SIN RESPUESTA');
        jest.advanceTimersByTime(5 * 60 * 1000 + 10);
        expect(matrixService.sent.length).toBe(2);
        expect(matrixService.sent[1].msg).toContain('URGENTE');
        jest.advanceTimersByTime(60 * 60 * 1000);
        expect(matrixService.sent.length).toBe(2); // no spam after final stage
    });

    test('family reply acknowledges: timers stop, she hears who saw it', async () => {
        await alertService._test.onMatrixMessage(ownAlert('🔴 Necesito ayuda'));
        await alertService._test.onMatrixMessage(familyReply('Voy para allá', 'Ana'));
        expect(alertService.getActiveAlert()).toBeNull();
        expect(speechService.spoken.join(' ')).toContain('Ana');
        jest.advanceTimersByTime(60 * 60 * 1000);
        expect(matrixService.sent.length).toBe(0); // no escalations after ack
    });

    test('own escalation echo does not restart tracking', async () => {
        await alertService._test.onMatrixMessage(ownAlert('🔴 Necesito ayuda'));
        await alertService._test.onMatrixMessage(familyReply('ya voy'));
        await alertService._test.onMatrixMessage(ownAlert('⚠️ SIN RESPUESTA: 🔴 Necesito ayuda'));
        expect(alertService.getActiveAlert()).toBeNull();
    });

    test('normal chat messages are ignored', async () => {
        await alertService._test.onMatrixMessage(ownAlert('Estoy bien'));
        expect(alertService.getActiveAlert()).toBeNull();
        await alertService._test.onMatrixMessage(familyReply('hola'));
        expect(matrixService.sent.length).toBe(0);
    });
});
