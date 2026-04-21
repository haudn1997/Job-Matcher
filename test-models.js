require('dotenv').config({ path: '.env.local' });
if (!process.env.GEMINI_API_KEY) require('dotenv').config({ path: '.env' });

async function run() {
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await res.json();
        console.log("AVAILABLE MODELS:", data.models.map(m => m.name).join("\n"));
    } catch (e) {
        console.error(e);
    }
}
run();
