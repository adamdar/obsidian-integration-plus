import { App, Modal, Setting } from "obsidian";

/** Keep destructive pulls behind an explicit confirmation for the captured note. */
export class OverwritePullModal extends Modal {
	constructor(
		app: App,
		private readonly notePath: string,
		private readonly onConfirm: () => Promise<void>,
	) {
		super(app);
	}

	override onOpen() {
		this.setTitle("Overwrite note from Confluence?");
		this.contentEl.createEl("p", { text: this.notePath });
		this.contentEl.createEl("p", {
			text: "The note body will be replaced with the Confluence version. Local body changes and conflict markers will be lost. Frontmatter will be kept, and the Confluence title will be updated.",
		});
		let confirmed = false;
		new Setting(this.contentEl)
			.addButton((button) => {
				button.setButtonText("Cancel").onClick(() => this.close());
				button.buttonEl.focus();
			})
			.addButton((button) =>
				button
					.setButtonText("Overwrite")
					.setCta()
					.onClick(() => {
						if (confirmed) return;
						confirmed = true;
						this.close();
						void this.onConfirm();
					}),
			);
	}

	override onClose() {
		this.contentEl.empty();
	}
}
