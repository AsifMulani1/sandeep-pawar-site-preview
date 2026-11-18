(() => {
	const THEMES = ["auto", "light", "dark"];
	const LABELS = { auto: "Theme: auto", light: "Theme: light", dark: "Theme: dark" };

	function storedTheme() {
		try {
			return localStorage.getItem("theme") || "auto";
		} catch {
			return "auto";
		}
	}

	function applyTheme(theme) {
		if (theme === "auto") document.documentElement.removeAttribute("data-theme");
		else document.documentElement.setAttribute("data-theme", theme);
		document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
			button.textContent = LABELS[theme];
			button.hidden = false;
		});
	}

	function cycleTheme() {
		const next = THEMES[(THEMES.indexOf(storedTheme()) + 1) % THEMES.length];
		try {
			localStorage.setItem("theme", next);
		} catch {}
		applyTheme(next);
	}

	function errorMessage(body, status) {
		if (status === 429) return "Too many attempts from this connection. Please try again in an hour.";
		try {
			const messages = JSON.parse(body._server_messages || "[]");
			if (messages.length) return JSON.parse(messages[0]).message;
		} catch {}
		return "Something went wrong. Please try again.";
	}

	async function submitForm(form) {
		const status = form.querySelector(".form-status");
		const button = form.querySelector("button[type=submit]");
		button.disabled = true;
		status.removeAttribute("data-tone");
		status.textContent = "Sending…";
		try {
			const response = await fetch(form.action, {
				method: "POST",
				headers: { Accept: "application/json" },
				body: new URLSearchParams(new FormData(form)),
			});
			const body = await response.json().catch(() => ({}));
			if (!response.ok) throw new Error(errorMessage(body, response.status));
			showDone(form, body.message && body.message.status);
		} catch (error) {
			status.dataset.tone = "error";
			status.textContent = error.message;
			button.disabled = false;
		}
	}

	function showDone(form, result) {
		const status = form.querySelector(".form-status");
		const message = form.dataset[result === "already" ? "already" : "done"];
		if (form.dataset.replace !== undefined) {
			const note = document.createElement("p");
			note.className = "done-message";
			note.setAttribute("role", "status");
			note.textContent = message;
			form.replaceWith(note);
			return;
		}
		status.textContent = message;
		form.reset();
		form.querySelector("button[type=submit]").disabled = false;
	}

	async function copyLink(button) {
		await navigator.clipboard.writeText(button.dataset.copy);
		const label = button.querySelector("span");
		label.textContent = "Link copied";
		setTimeout(() => (label.textContent = "Copy link"), 2000);
	}

	applyTheme(storedTheme());
	document.addEventListener("click", (event) => {
		if (event.target.closest("[data-theme-toggle]")) cycleTheme();
		const copy = event.target.closest("[data-copy]");
		if (copy) copyLink(copy);
	});
	document.addEventListener("submit", (event) => {
		const form = event.target.closest("form[data-async]");
		if (!form) return;
		event.preventDefault();
		submitForm(form);
	});
})();
