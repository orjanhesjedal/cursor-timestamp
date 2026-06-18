import {
	App,
	Editor,
	MarkdownView,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";
import {
	buildStamp,
	DEFAULT_SETTINGS,
	listTimeZones,
	StampMode,
	systemTimeZone,
	TimestampSettings,
	TimeZonePosition,
	TimeZoneStyle,
} from "./timestamp";

export default class CursorTimestampPlugin extends Plugin {
	// Copy, never alias, the shared defaults object, so loading/saving can never
	// mutate the module-level DEFAULT_SETTINGS for the rest of the process.
	settings: TimestampSettings = { ...DEFAULT_SETTINGS };

	async onload(): Promise<void> {
		await this.loadSettings();

		this.addCommand({
			id: "insert-timestamp",
			name: "Insert timestamp at cursor",
			editorCallback: (editor: Editor) => this.insert(editor, "full"),
		});
		this.addCommand({
			id: "insert-date",
			name: "Insert date at cursor",
			editorCallback: (editor: Editor) => this.insert(editor, "date"),
		});
		this.addCommand({
			id: "insert-time",
			name: "Insert time at cursor",
			editorCallback: (editor: Editor) => this.insert(editor, "time"),
		});

		this.addRibbonIcon("clock", "Insert timestamp", () => {
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (view) {
				this.insert(view.editor, "full");
			} else {
				new Notice("Open a note in editing mode to insert a timestamp.");
			}
		});

		this.addSettingTab(new TimestampSettingTab(this.app, this));
	}

	private insert(editor: Editor, mode: StampMode): void {
		editor.replaceSelection(buildStamp(this.settings, mode));
	}

	async loadSettings(): Promise<void> {
		const saved = (await this.loadData()) as Partial<TimestampSettings> | null;
		this.settings = { ...DEFAULT_SETTINGS, ...(saved ?? {}) };
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}

class TimestampSettingTab extends PluginSettingTab {
	private readonly plugin: CursorTimestampPlugin;
	private previewEl: HTMLElement | null = null;

	constructor(app: App, plugin: CursorTimestampPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	private refreshPreview(): void {
		if (this.previewEl) {
			this.previewEl.setText(buildStamp(this.plugin.settings, "full"));
		}
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		const preview = containerEl.createDiv({ cls: "cursor-timestamp-preview" });
		preview.createDiv({ cls: "cursor-timestamp-preview-label", text: "Live preview" });
		this.previewEl = preview.createEl("code", {
			cls: "cursor-timestamp-preview-value",
		});
		this.refreshPreview();

		const settings = this.plugin.settings;
		const commit = async (): Promise<void> => {
			await this.plugin.saveSettings();
			this.refreshPreview();
		};

		new Setting(containerEl).setName("Format").setHeading();

		new Setting(containerEl)
			.setName("Time zone")
			.setDesc(
				"Choose System default to follow this computer, or pick a fixed zone so collaborators in other zones read the same time.",
			)
			.addDropdown((dropdown) => {
				dropdown.addOption("", `System default (${systemTimeZone()})`);
				for (const zone of listTimeZones()) {
					dropdown.addOption(zone, zone);
				}
				dropdown.setValue(settings.timeZone);
				dropdown.onChange(async (value) => {
					settings.timeZone = value;
					await commit();
				});
			});

		new Setting(containerEl)
			.setName("Date format")
			.setDesc("Tokens: YYYY, YY, MM, M, DD, D, MMMM, MMM, dddd, ddd. Wrap literal letters in [brackets].")
			.addText((text) =>
				text
					.setPlaceholder("YYYY-MM-DD")
					.setValue(settings.dateFormat)
					.onChange(async (value) => {
						settings.dateFormat = value;
						await commit();
					}),
			);

		new Setting(containerEl)
			.setName("Time format")
			.setDesc("Tokens: HH, H, hh, h, mm, m, ss, s, A, a.")
			.addText((text) =>
				text
					.setPlaceholder("HH:mm:ss")
					.setValue(settings.timeFormat)
					.onChange(async (value) => {
						settings.timeFormat = value;
						await commit();
					}),
			);

		new Setting(containerEl)
			.setName("Between date and time")
			.setDesc('Text inserted between the date and the time, for example " @".')
			.addText((text) =>
				text
					.setPlaceholder(" @")
					.setValue(settings.dateTimeSeparator)
					.onChange(async (value) => {
						settings.dateTimeSeparator = value;
						await commit();
					}),
			);

		new Setting(containerEl).setName("Time-zone label").setHeading();

		new Setting(containerEl)
			.setName("Show time zone")
			.setDesc("Add a label such as GMT+2 or CET to each stamp.")
			.addToggle((toggle) =>
				toggle.setValue(settings.showTimeZone).onChange(async (value) => {
					settings.showTimeZone = value;
					await commit();
				}),
			);

		new Setting(containerEl).setName("Label style").addDropdown((dropdown) => {
			dropdown.addOption("short", "Short (CET)");
			dropdown.addOption("shortOffset", "Offset (GMT+2)");
			dropdown.addOption("long", "Long (Central European Time)");
			dropdown.setValue(settings.timeZoneStyle);
			dropdown.onChange(async (value) => {
				settings.timeZoneStyle = value as TimeZoneStyle;
				await commit();
			});
		});

		new Setting(containerEl).setName("Label position").addDropdown((dropdown) => {
			dropdown.addOption("afterTime", "After the time");
			dropdown.addOption("beforeDate", "Before the date");
			dropdown.setValue(settings.timeZonePosition);
			dropdown.onChange(async (value) => {
				settings.timeZonePosition = value as TimeZonePosition;
				await commit();
			});
		});

		new Setting(containerEl)
			.setName("Label separator")
			.setDesc("Text between the time-zone label and the rest of the stamp.")
			.addText((text) =>
				text
					.setPlaceholder(" ")
					.setValue(settings.timeZoneSeparator)
					.onChange(async (value) => {
						settings.timeZoneSeparator = value;
						await commit();
					}),
			);

		new Setting(containerEl).setName("Surrounding text").setHeading();

		new Setting(containerEl)
			.setName("Prefix")
			.setDesc('Inserted before the stamp, for example "Comment by Nathan ".')
			.addText((text) =>
				text.setValue(settings.prefix).onChange(async (value) => {
					settings.prefix = value;
					await commit();
				}),
			);

		new Setting(containerEl)
			.setName("Suffix")
			.setDesc('Inserted after the stamp, for example ":" or " Nathan wrote:".')
			.addText((text) =>
				text.setValue(settings.suffix).onChange(async (value) => {
					settings.suffix = value;
					await commit();
				}),
			);

		new Setting(containerEl).setName("Style").setHeading();

		new Setting(containerEl).setName("Bold").addToggle((toggle) =>
			toggle.setValue(settings.bold).onChange(async (value) => {
				settings.bold = value;
				await commit();
			}),
		);

		new Setting(containerEl).setName("Italic").addToggle((toggle) =>
			toggle.setValue(settings.italic).onChange(async (value) => {
				settings.italic = value;
				await commit();
			}),
		);

		new Setting(containerEl)
			.setName("Coloured text")
			.setDesc("When on, the stamp is wrapped in an inline HTML span so the colour shows in reading view.")
			.addToggle((toggle) =>
				toggle.setValue(settings.useColor).onChange(async (value) => {
					settings.useColor = value;
					await commit();
				}),
			);

		new Setting(containerEl).setName("Colour").addColorPicker((picker) =>
			picker.setValue(settings.color).onChange(async (value) => {
				settings.color = value;
				await commit();
			}),
		);

		new Setting(containerEl)
			.setName("Hotkeys")
			.setDesc(
				'Assign keyboard shortcuts under Settings → Hotkeys, then search for "Cursor Timestamp".',
			);
	}
}
