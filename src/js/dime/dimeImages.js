/**
 * Dime — bundled Twemoji SVG images (CC-BY 4.0, (c) Twitter/X and contributors).
 * Offline-first: assets live in app/img/dime/ (GEN-2). Fallback: raw emoji text.
 * Regenerate the map when adding emoji: see dime-app repo tooling notes.
 */

let EMOJI_FILES = {
    "👄": "1f444.svg",
    "👍": "1f44d.svg",
    "👎": "1f44e.svg",
    "👩": "1f469.svg",
    "👨": "1f468.svg",
    "⏰": "23f0.svg",
    "💧": "1f4a7.svg",
    "🍞": "1f35e.svg",
    "☕": "2615.svg",
    "🍲": "1f372.svg",
    "🥛": "1f95b.svg",
    "🏠": "1f3e0.svg",
    "🛏️": "1f6cf.svg",
    "🚻": "1f6bb.svg",
    "✋": "270b.svg",
    "☀️": "2600.svg",
    "🌸": "1f338.svg",
    "🐕": "1f415.svg",
    "🍽️": "1f37d.svg",
    "👟": "1f45f.svg",
    "🤕": "1f915.svg",
    "🚶": "1f6b6.svg",
    "👌": "1f44c.svg",
    "❤️": "2764.svg",
    "🌅": "1f305.svg",
    "🙏": "1f64f.svg",
    "📞": "1f4de.svg",
    "🚪": "1f6aa.svg",
    "🙂": "1f642.svg",
    "🗣️": "1f5e3.svg",
    "💬": "1f4ac.svg",
    "🔊": "1f50a.svg",
    "⏳": "23f3.svg",
    "🎉": "1f389.svg",
    "🌱": "1f331.svg",
    "🌟": "1f31f.svg",
    "💪": "1f4aa.svg"
};

let dimeImages = {};

/** returns bundled svg path for an emoji, or null if not bundled */
dimeImages.getPath = function (emoji) {
    let file = EMOJI_FILES[emoji];
    return file ? 'app/img/dime/' + file : null;
};

export { dimeImages };
