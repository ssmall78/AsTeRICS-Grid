<template>
    <div class="dime-practica">
        <!-- Level picker -->
        <div v-if="screen === 'levels'" class="dp-screen">
            <h1 class="dp-title">Práctica</h1>
            <p class="dp-week">{{ weekMessage }}</p>
            <div class="dp-levels">
                <button v-for="level in levels" :key="level.id" class="dp-level-btn" @click="startLevel(level)">
                    <img v-if="picSrc(level.emoji)" class="dp-level-img" :src="picSrc(level.emoji)" alt="" aria-hidden="true"/>
                    <span v-else class="dp-level-emoji">{{ level.emoji }}</span>
                    <span class="dp-level-label">{{ level.label }}</span>
                    <span class="dp-level-desc">{{ level.description }}</span>
                </button>
            </div>
            <button class="dp-home" @click="goHome()">🏠 Inicio</button>
            <p class="dp-attribution">Imágenes: Twemoji (CC-BY 4.0)</p>
        </div>

        <!-- Drill card -->
        <div v-if="screen === 'drill'" class="dp-screen">
            <div class="dp-card" :class="{ 'dp-card-celebrate': celebrating }">
                <div class="dp-pic">
                    <img v-if="picSrc(currentItem.pic)" class="dp-pic-img" :src="picSrc(currentItem.pic)" :alt="currentItem.text"/>
                    <span v-else>{{ currentItem.pic }}</span>
                </div>

                <!-- cue level 0: word always visible; 1: syllable cue; 2: hidden until reveal -->
                <div v-if="cueLevel === 0 || revealed" class="dp-word">{{ currentItem.text }}</div>
                <div v-else-if="cueLevel === 1" class="dp-word dp-word-cue">
                    {{ firstSyllable }}<span class="dp-word-rest">…</span>
                </div>
                <button v-else class="dp-reveal" @click="reveal()">Ver la palabra</button>

                <div v-if="currentCue" class="dp-cue">💡 {{ currentCue }}</div>
                <button v-if="hasMoreCues" class="dp-more-cues" @click="nextCue()">Otra pista</button>
            </div>

            <button class="dp-listen" @click="listen()">🔊 Escuchar</button>

            <div class="dp-result-btns">
                <button class="dp-btn dp-btn-yes" @click="mark('success')">✅ ¡Lo dijo!</button>
                <button class="dp-btn dp-btn-almost" @click="mark('almost')">🔁 Casi</button>
                <button class="dp-btn dp-btn-skip" @click="mark('skip')">➡️ Otra</button>
            </div>

            <div class="dp-progress">
                <span v-for="(item, index) in sessionItems" :key="item.id"
                      class="dp-dot" :class="{ 'dp-dot-on': index === itemIndex, 'dp-dot-done': index < itemIndex }">●</span>
            </div>
            <button class="dp-home" @click="endSession()">Terminar</button>
        </div>

        <!-- Session end -->
        <div v-if="screen === 'done'" class="dp-screen dp-done">
            <div class="dp-done-emoji">🎉</div>
            <h1 class="dp-title">¡Muy bien!</h1>
            <p class="dp-done-stats">{{ doneMessage }}</p>
            <p class="dp-week">{{ weekMessage }}</p>
            <button class="dp-btn dp-btn-yes dp-btn-wide" @click="screen = 'levels'">Practicar más</button>
            <button class="dp-home" @click="goHome()">🏠 Inicio</button>
        </div>
    </div>
</template>

<script>
    import { Router } from '../../../js/router.js';
    import { speechService } from '../../../js/service/speechService.js';
    import { practiceData } from '../../../js/dime/practiceData.js';
    import { practiceService } from '../../../js/dime/practiceService.js';
    import { dimeImages } from '../../../js/dime/dimeImages.js';
    import { practiceSync } from '../../../js/dime/practiceSync.js';

    let BLOCK_SIZE = 6; // items per block: short blocks, rest offered between (PRX-6)
    let SLOW_RATE = 0.6;

    export default {
        components: {},
        data() {
            return {
                levels: practiceData.LEVELS,
                screen: 'levels',
                currentLevel: null,
                sessionItems: [],
                itemIndex: 0,
                cueIndex: -1,
                revealed: false,
                celebrating: false,
                sessionStart: null,
                sessionSuccesses: 0,
                weekMessage: practiceService.getWeekMessage(),
                doneMessage: ''
            };
        },
        computed: {
            currentItem() {
                return this.sessionItems[this.itemIndex] || {};
            },
            cueLevel() {
                return this.currentItem.id ? practiceService.getItemState(this.currentItem.id).cueLevel : 0;
            },
            firstSyllable() {
                let s = this.currentItem.syllables;
                return s && s.length ? s[0] : '';
            },
            currentCue() {
                let cues = this.currentItem.cues || [];
                return this.cueIndex >= 0 && this.cueIndex < cues.length ? cues[this.cueIndex] : null;
            },
            hasMoreCues() {
                let cues = this.currentItem.cues || [];
                return this.cueIndex < cues.length - 1;
            }
        },
        methods: {
            startLevel(level) {
                this.currentLevel = level;
                let items = practiceData.getItemsForLevel(level.id);
                // mix: mostly known items (success keeps her coming back), 1-2 challenging
                let sorted = [...items].sort((a, b) => {
                    let sa = practiceService.getItemState(a.id);
                    let sb = practiceService.getItemState(b.id);
                    return sb.successes - sa.successes;
                });
                let known = sorted.slice(0, BLOCK_SIZE - 2);
                let fresh = sorted.slice(BLOCK_SIZE - 2);
                this.sessionItems = shuffle(known.concat(fresh.slice(0, 2))).slice(0, BLOCK_SIZE);
                this.itemIndex = 0;
                this.cueIndex = -1;
                this.revealed = false;
                this.sessionStart = Date.now();
                this.sessionSuccesses = 0;
                this.screen = 'drill';
                this.autoModel();
            },
            autoModel() {
                // cue level 0: play the audio model automatically ("escucha y repite")
                if (this.cueLevel === 0) {
                    this.listen();
                }
            },
            listen() {
                speechService.speak(this.currentItem.text, { lang: 'es', rate: SLOW_RATE });
            },
            reveal() {
                this.revealed = true;
                this.listen();
            },
            nextCue() {
                this.cueIndex++;
            },
            mark(result) {
                let state = practiceService.recordAttempt(this.currentItem.id, result);
                if (result === 'success') {
                    this.sessionSuccesses++;
                    this.celebrate();
                }
                if (state.advanced) {
                    speechService.speak('¡Muy bien!', { lang: 'es' });
                }
                setTimeout(() => this.advance(), result === 'success' ? 600 : 0);
            },
            celebrate() {
                this.celebrating = true;
                setTimeout(() => (this.celebrating = false), 600);
            },
            advance() {
                if (this.itemIndex >= this.sessionItems.length - 1) {
                    return this.endSession();
                }
                this.itemIndex++;
                this.cueIndex = -1;
                this.revealed = false;
                this.autoModel();
            },
            endSession() {
                if (this.sessionStart) {
                    let ms = Date.now() - this.sessionStart;
                    practiceService.logSession(
                        this.currentLevel ? this.currentLevel.id : '?',
                        ms,
                        this.itemIndex + 1,
                        this.sessionSuccesses
                    );
                    let mins = Math.max(1, Math.round(ms / 60000));
                    this.doneMessage = `${this.sessionSuccesses} palabras dichas · ${mins} min de práctica`;
                    this.sessionStart = null;
                    practiceSync.pushToAccount(); // PRX-8: fire-and-safe, offline queues via pouchdb
                }
                this.weekMessage = practiceService.getWeekMessage();
                this.screen = 'done';
            },
            goHome() {
                Router.toMain();
            },
            picSrc(emoji) {
                return dimeImages.getPath(emoji);
            }
        },
        async mounted() {
            // PRX-8/9: pull account progress (e.g. FE device viewing her progress); offline-safe
            let pulled = await practiceSync.pullFromAccount();
            if (pulled) {
                this.weekMessage = practiceService.getWeekMessage();
            }
        }
    };

    function shuffle(array) {
        let a = [...array];
        for (let i = a.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }
</script>

<style scoped>
    /* ACC-1..9: huge tap-only targets, >=20pt text, high contrast, feedback-only animation */
    .dime-practica {
        position: relative;
        height: 100%;
        overflow-y: auto;
        background: #faf6ef;
        color: #26221b;
        font-family: Georgia, 'Times New Roman', serif;
    }
    .dp-screen {
        max-width: 700px;
        margin: 0 auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        align-items: stretch;
    }
    .dp-title { font-size: 2rem; text-align: center; margin: 4px 0 0 0; color: #b4552d; }
    .dp-week { text-align: center; font-size: 1.25rem; margin: 0; color: #3e7a4e; }
    .dp-levels { display: flex; flex-direction: column; gap: 14px; }
    .dp-level-btn {
        min-height: 84px; border: 3px solid #e5dccc; border-radius: 20px; background: #fff;
        display: flex; align-items: center; gap: 16px; padding: 12px 20px; cursor: pointer;
        font-family: inherit; text-align: left;
    }
    .dp-level-btn:active { background: #f4e3d7; border-color: #b4552d; }
    .dp-level-emoji { font-size: 2.4rem; }
    .dp-level-img { width: 52px; height: 52px; }
    .dp-pic-img { width: 110px; height: 110px; }
    .dp-attribution { text-align: center; font-size: 0.85rem; color: #a89e8a; margin: 0; }
    .dp-level-label { font-size: 1.6rem; font-weight: bold; }
    .dp-level-desc { font-size: 1.05rem; color: #6b6350; margin-left: auto; text-align: right; }
    .dp-card {
        background: #fff; border: 3px solid #e5dccc; border-radius: 24px;
        padding: 26px 16px; text-align: center; display: flex; flex-direction: column; gap: 10px; align-items: center;
    }
    .dp-card-celebrate { border-color: #3e7a4e; background: #eef7f0; }
    .dp-pic { font-size: 4.2rem; line-height: 1; }
    .dp-word { font-size: 3.2rem; font-weight: bold; color: #2f5d8a; }
    .dp-word-cue .dp-word-rest { color: #b9ab90; }
    .dp-cue { font-size: 1.35rem; color: #6b6350; font-style: italic; }
    .dp-reveal, .dp-more-cues {
        min-height: 56px; padding: 10px 22px; font-size: 1.25rem; font-family: inherit;
        border-radius: 14px; border: 3px solid #e5dccc; background: #fff; cursor: pointer;
    }
    .dp-listen {
        min-height: 84px; font-size: 1.7rem; font-weight: bold; font-family: inherit;
        border-radius: 18px; border: none; background: #2f5d8a; color: #fff; cursor: pointer;
    }
    .dp-listen:active { background: #234668; }
    .dp-result-btns { display: flex; gap: 10px; }
    .dp-btn {
        flex: 1; min-height: 84px; font-size: 1.35rem; font-weight: bold; font-family: inherit;
        border-radius: 18px; border: 3px solid #e5dccc; background: #fff; cursor: pointer;
    }
    .dp-btn-yes { background: #3e7a4e; border-color: #3e7a4e; color: #fff; }
    .dp-btn-almost { background: #fff; }
    .dp-btn-skip { background: #fff; color: #6b6350; }
    .dp-btn-wide { flex: none; width: 100%; }
    .dp-progress { text-align: center; letter-spacing: 8px; color: #d8cdb6; font-size: 1.1rem; }
    .dp-dot-on { color: #b4552d; }
    .dp-dot-done { color: #3e7a4e; }
    .dp-home {
        min-height: 64px; font-size: 1.3rem; font-family: inherit; border-radius: 16px;
        border: 3px solid #e5dccc; background: #fff; cursor: pointer; color: #26221b;
    }
    .dp-done { text-align: center; }
    .dp-done-emoji { font-size: 4rem; text-align: center; }
    .dp-done-stats { text-align: center; font-size: 1.35rem; margin: 0; }
</style>
