/*
 * Pure timestamp logic, deliberately free of any Obsidian imports so it can be
 * unit-tested in isolation and reasoned about on its own. main.ts wires this
 * into the plugin (commands, ribbon, settings tab).
 */

export type TimeZoneStyle = "short" | "shortOffset" | "long";
export type TimeZonePosition = "afterTime" | "beforeDate";
export type StampMode = "full" | "date" | "time";

export interface TimestampSettings {
	/** Empty string means "follow this computer"; otherwise an IANA name such as "Europe/Oslo". */
	timeZone: string;
	/** Date token string, e.g. "YYYY-MM-DD". */
	dateFormat: string;
	/** Time token string, e.g. "HH:mm:ss". */
	timeFormat: string;
	/** Text placed between the date and the time, e.g. " @". */
	dateTimeSeparator: string;
	/** Whether to add a time-zone label such as GMT+2 or CET. */
	showTimeZone: boolean;
	timeZoneStyle: TimeZoneStyle;
	timeZonePosition: TimeZonePosition;
	/** Text placed between the time-zone label and the rest of the stamp. */
	timeZoneSeparator: string;
	/** Text before the stamp, e.g. "Comment by Nathan ". */
	prefix: string;
	/** Text after the stamp, e.g. ":" or " Nathan wrote:". */
	suffix: string;
	bold: boolean;
	italic: boolean;
	useColor: boolean;
	/** Hex colour, only used when useColor is true. */
	color: string;
}

export const DEFAULT_SETTINGS: TimestampSettings = {
	timeZone: "",
	dateFormat: "YYYY-MM-DD",
	timeFormat: "HH:mm:ss",
	dateTimeSeparator: " @",
	showTimeZone: false,
	timeZoneStyle: "short",
	timeZonePosition: "afterTime",
	timeZoneSeparator: " ",
	prefix: "",
	suffix: "",
	bold: false,
	italic: false,
	useColor: false,
	color: "#e07a5f",
};

interface DateFields {
	year: string;
	month: string;
	day: string;
	hour24: string;
	minute: string;
	second: string;
}

/**
 * Resolve this computer's IANA time zone, used to label the "System default"
 * option. Wrapped in try/catch so a missing Intl implementation can never throw.
 */
export function systemTimeZone(): string {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
	} catch (_unused) {
		return "UTC";
	}
}

/**
 * Extract the calendar fields for an instant, rendered in a specific IANA time
 * zone. Intl.DateTimeFormat is used on purpose: it keeps the plugin
 * dependency-free and makes daylight-saving transitions correct, because the
 * conversion is performed by the platform's time-zone database rather than by
 * hand-rolled offset arithmetic.
 */
export function getDateFields(date: Date, timeZone: string): DateFields {
	const formatter = new Intl.DateTimeFormat("en-US", {
		timeZone: timeZone || undefined,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hourCycle: "h23",
	});
	const lookup: Record<string, string> = {};
	for (const part of formatter.formatToParts(date)) {
		lookup[part.type] = part.value;
	}
	return {
		year: lookup.year ?? "1970",
		month: lookup.month ?? "01",
		day: lookup.day ?? "01",
		hour24: lookup.hour ?? "00",
		minute: lookup.minute ?? "00",
		second: lookup.second ?? "00",
	};
}

/** Month/weekday names follow the user's locale so MMMM/dddd read naturally. */
function localeName(
	date: Date,
	timeZone: string,
	kind: "month" | "weekday",
	width: "long" | "short",
): string {
	try {
		const options: Intl.DateTimeFormatOptions =
			kind === "month" ? { month: width } : { weekday: width };
		options.timeZone = timeZone || undefined;
		return new Intl.DateTimeFormat(undefined, options).format(date);
	} catch (_unused) {
		return "";
	}
}

export function timeZoneLabel(date: Date, timeZone: string, style: TimeZoneStyle): string {
	const tryStyle = (named: "short" | "long" | "shortOffset"): string | null => {
		try {
			const formatter = new Intl.DateTimeFormat("en-US", {
				timeZone: timeZone || undefined,
				timeZoneName: named,
			});
			for (const part of formatter.formatToParts(date)) {
				if (part.type === "timeZoneName") {
					return part.value;
				}
			}
			return null;
		} catch (_unused) {
			return null;
		}
	};
	// Fall back to "short" if the platform rejects the requested style.
	return tryStyle(style) ?? tryStyle("short") ?? "";
}

function pad2(value: string): string {
	return value.padStart(2, "0");
}

function dropLeadingZero(value: string): string {
	return String(Number(value));
}

/**
 * Replace a small, moment-like set of tokens. Only the date and time format
 * strings pass through here, never the user's prefix/suffix, so ordinary words
 * are never mangled. Letters wrapped in [square brackets] are kept literally.
 */
export function formatTokens(
	format: string,
	date: Date,
	fields: DateFields,
	timeZone: string,
): string {
	const hour24 = Number(fields.hour24);
	const hour12 = ((hour24 + 11) % 12) + 1;
	const pattern =
		/\[([^\]]*)\]|YYYY|YY|MMMM|MMM|MM|M|DD|D|dddd|ddd|HH|H|hh|h|mm|m|ss|s|A|a/g;

	return format.replace(pattern, (match: string, literal: string | undefined) => {
		if (literal !== undefined) {
			return literal;
		}
		switch (match) {
			case "YYYY":
				return fields.year;
			case "YY":
				return fields.year.slice(-2);
			case "MMMM":
				return localeName(date, timeZone, "month", "long");
			case "MMM":
				return localeName(date, timeZone, "month", "short");
			case "MM":
				return fields.month;
			case "M":
				return dropLeadingZero(fields.month);
			case "DD":
				return fields.day;
			case "D":
				return dropLeadingZero(fields.day);
			case "dddd":
				return localeName(date, timeZone, "weekday", "long");
			case "ddd":
				return localeName(date, timeZone, "weekday", "short");
			case "HH":
				return fields.hour24;
			case "H":
				return dropLeadingZero(fields.hour24);
			case "hh":
				return pad2(String(hour12));
			case "h":
				return String(hour12);
			case "mm":
				return fields.minute;
			case "m":
				return dropLeadingZero(fields.minute);
			case "ss":
				return fields.second;
			case "s":
				return dropLeadingZero(fields.second);
			case "A":
				return hour24 < 12 ? "AM" : "PM";
			case "a":
				return hour24 < 12 ? "am" : "pm";
			default:
				return match;
		}
	});
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

/**
 * Apply bold/italic/colour. A requested colour forces an inline HTML span,
 * because Markdown has no colour syntax; without colour we use Markdown markers
 * so the note stays clean and portable.
 */
export function applyStyle(text: string, settings: TimestampSettings): string {
	if (settings.useColor) {
		const styles: string[] = [`color: ${settings.color}`];
		if (settings.bold) {
			styles.push("font-weight: bold");
		}
		if (settings.italic) {
			styles.push("font-style: italic");
		}
		return `<span style="${styles.join("; ")}">${escapeHtml(text)}</span>`;
	}
	if (settings.bold && settings.italic) {
		return `***${text}***`;
	}
	if (settings.bold) {
		return `**${text}**`;
	}
	if (settings.italic) {
		return `*${text}*`;
	}
	return text;
}

/** Build the exact text that will be inserted at the cursor. */
export function buildStamp(
	settings: TimestampSettings,
	mode: StampMode,
	date: Date = new Date(),
): string {
	const fields = getDateFields(date, settings.timeZone);
	const dateStr = formatTokens(settings.dateFormat, date, fields, settings.timeZone);
	const timeStr = formatTokens(settings.timeFormat, date, fields, settings.timeZone);

	if (mode === "date") {
		return applyStyle(dateStr, settings);
	}
	if (mode === "time") {
		return applyStyle(timeStr, settings);
	}

	let core = `${dateStr}${settings.dateTimeSeparator}${timeStr}`;
	if (settings.showTimeZone) {
		const label = timeZoneLabel(date, settings.timeZone, settings.timeZoneStyle);
		if (label) {
			core =
				settings.timeZonePosition === "beforeDate"
					? `${label}${settings.timeZoneSeparator}${core}`
					: `${core}${settings.timeZoneSeparator}${label}`;
		}
	}
	return applyStyle(`${settings.prefix}${core}${settings.suffix}`, settings);
}

/** The full IANA list when the platform supports it, otherwise a short fallback. */
export function listTimeZones(): string[] {
	const intlWithSupport = Intl as typeof Intl & {
		supportedValuesOf?: (key: "timeZone") => string[];
	};
	if (typeof intlWithSupport.supportedValuesOf === "function") {
		try {
			return intlWithSupport.supportedValuesOf("timeZone");
		} catch (_unused) {
			/* fall through to the short list */
		}
	}
	return FALLBACK_TIME_ZONES;
}

export const FALLBACK_TIME_ZONES: string[] = [
	"UTC",
	"Europe/Oslo",
	"Europe/London",
	"Europe/Berlin",
	"Europe/Paris",
	"Europe/Madrid",
	"Europe/Moscow",
	"America/New_York",
	"America/Chicago",
	"America/Denver",
	"America/Los_Angeles",
	"America/Sao_Paulo",
	"Asia/Dubai",
	"Asia/Kolkata",
	"Asia/Shanghai",
	"Asia/Tokyo",
	"Australia/Sydney",
	"Pacific/Auckland",
];
