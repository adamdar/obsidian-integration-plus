import { beforeEach, expect, test, vi } from "vitest";
import type { App } from "obsidian";
import { OverwritePullModal } from "./OverwritePullModal";

const ui = vi.hoisted(() => ({
	texts: [] as string[],
	buttons: [] as { text: string; click?: () => void }[],
}));

// Obsidian supplies only types in Node. Exercise the modal's event wiring with a tiny UI stub.
vi.mock("obsidian", () => ({
	Modal: class {
		contentEl = {
			createEl: (_tag: string, options: { text: string }) => {
				ui.texts.push(options.text);
			},
			empty: () => {
				ui.texts.length = 0;
			},
		};
		setTitle(title: string) {
			ui.texts.push(title);
		}
		close() {
			this.onClose();
		}
		onClose() {
			/* Overridden by the modal under test. */
		}
	},
	Setting: class {
		addButton(build: (button: unknown) => void) {
			const state: { text: string; click?: () => void } = { text: "" };
			ui.buttons.push(state);
			const button = {
				buttonEl: { focus: () => undefined },
				setButtonText: (text: string) => {
					state.text = text;
					return button;
				},
				setCta: () => button,
				onClick: (click: () => void) => {
					state.click = click;
					return button;
				},
			};
			build(button);
			return this;
		}
	},
}));

beforeEach(() => {
	ui.texts.length = 0;
	ui.buttons.length = 0;
});

test("overwrite confirmation names the captured note and doesn't start work on opening", () => {
	const confirm = vi.fn(async () => undefined);
	const modal = new OverwritePullModal({} as App, "Docs/Original.md", confirm);
	modal.onOpen();
	expect(ui.texts).toContain("Docs/Original.md");
	expect(ui.texts.join(" ")).toContain("will be lost");
	expect(ui.buttons.map((button) => button.text)).toEqual(["Cancel", "Overwrite"]);
	expect(confirm).not.toHaveBeenCalled();
});

test("Cancel and dismissal leave the overwrite callback untouched", () => {
	const confirm = vi.fn(async () => undefined);
	const modal = new OverwritePullModal({} as App, "Docs/Original.md", confirm);
	modal.onOpen();
	ui.buttons.find((button) => button.text === "Cancel")?.click?.();
	modal.onClose();
	expect(confirm).not.toHaveBeenCalled();
});

test("Overwrite closes the dialog and runs the captured callback only once", () => {
	const confirm = vi.fn(async () => undefined);
	const modal = new OverwritePullModal({} as App, "Docs/Original.md", confirm);
	modal.onOpen();
	const overwrite = ui.buttons.find((button) => button.text === "Overwrite")!;
	overwrite.click?.();
	overwrite.click?.();
	expect(ui.texts).toEqual([]);
	expect(confirm).toHaveBeenCalledTimes(1);
});
