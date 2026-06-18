/*
 * Self-contained unit tests for the pure timestamp logic.
 * Run with `npm test`. It bundles src/timestamp.ts in memory (no Obsidian
 * needed) and asserts the exact inserted text for a range of settings.
 */
import esbuild from "esbuild";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";

const out = join(tmpdir(), `cursor-timestamp-test-${Date.now()}.mjs`);
await esbuild.build({
	entryPoints: ["src/timestamp.ts"],
	bundle: true,
	format: "esm",
	platform: "node",
	outfile: out,
	logLevel: "silent",
});
const { buildStamp, DEFAULT_SETTINGS, timeZoneLabel, listTimeZones } = await import(
	pathToFileURL(out).href
);

let pass = 0;
let fail = 0;
const S = (o) => Object.assign({}, DEFAULT_SETTINGS, o);
function eq(name, got, want) {
	if (got === want) {
		pass++;
		console.log("ok   -", name);
	} else {
		fail++;
		console.log("FAIL -", name, "\n   got :", JSON.stringify(got), "\n   want:", JSON.stringify(want));
	}
}
function ok(name, cond, info) {
	if (cond) {
		pass++;
		console.log("ok   -", name);
	} else {
		fail++;
		console.log("FAIL -", name, info || "");
	}
}

const d = new Date("2026-06-18T12:30:07Z");
eq("oslo full", buildStamp(S({ timeZone: "Europe/Oslo" }), "full", d), "2026-06-18 @14:30:07");
eq("oslo date", buildStamp(S({ timeZone: "Europe/Oslo" }), "date", d), "2026-06-18");
eq("oslo time", buildStamp(S({ timeZone: "Europe/Oslo" }), "time", d), "14:30:07");
eq("prefix+suffix", buildStamp(S({ timeZone: "Europe/Oslo", prefix: "Comment by Nathan ", suffix: ":" }), "full", d), "Comment by Nathan 2026-06-18 @14:30:07:");
eq("name wrote", buildStamp(S({ timeZone: "Europe/Oslo", suffix: " Nathan wrote:" }), "full", d), "2026-06-18 @14:30:07 Nathan wrote:");
eq("12-hour", buildStamp(S({ timeZone: "Europe/Oslo", timeFormat: "hh:mm:ss A" }), "time", d), "02:30:07 PM");
eq("new york", buildStamp(S({ timeZone: "America/New_York" }), "time", d), "08:30:07");
eq("tokyo", buildStamp(S({ timeZone: "Asia/Tokyo" }), "time", d), "21:30:07");
eq("midnight h23", buildStamp(S({ timeZone: "Europe/Oslo" }), "full", new Date("2026-01-01T23:30:00Z")), "2026-01-02 @00:30:00");
eq("bold+italic", buildStamp(S({ timeZone: "Europe/Oslo", bold: true, italic: true }), "time", d), "***14:30:07***");
eq("colour+bold", buildStamp(S({ timeZone: "Europe/Oslo", useColor: true, color: "#ff0000", bold: true }), "time", d), '<span style="color: #ff0000; font-weight: bold">14:30:07</span>');
eq("single digit", buildStamp(S({ timeZone: "Europe/Oslo", dateFormat: "YYYY-M-D", timeFormat: "H:m:s" }), "full", new Date("2026-06-08T05:09:03Z")), "2026-6-8 @7:9:3");
eq("literal bracket", buildStamp(S({ timeZone: "Europe/Oslo", timeFormat: "[at] HH" }), "time", d), "at 14");
const tzd = buildStamp(S({ timeZone: "Europe/Oslo", showTimeZone: true, timeZoneStyle: "shortOffset" }), "full", d);
ok("tz label appended", tzd.startsWith("2026-06-18 @14:30:07 ") && tzd.length > "2026-06-18 @14:30:07 ".length, tzd);
ok("tz list full", listTimeZones().length > 50 && listTimeZones().includes("Europe/Oslo"), "len=" + listTimeZones().length);

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
