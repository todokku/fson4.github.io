let version = "Numerals",
	[minLevel, maxLevel, minXY, maxXY] = [5, 9, 5, 8],
	randomize = true,
	reverse = { Numerals: false, Arrows: "Random" },
	time = () => mode === "Hard" ? 210 : 1500,
	sound = true,
	board, grid, numerals, arrows, mode, level, score, rounds, time1, time2,
	AudioContext = window.AudioContext || window.webkitAudioContext, audio = new AudioContext();

const create = (tag, parentNode, className) => {
		const el = document.createElementNS("http://www.w3.org/1999/xhtml", tag);
		if (parentNode) parentNode.appendChild(el);
		if (className) el.className = className;
		return el;
	},
	createArrow = degrees => {
		const arrow = create("div", 0, "arrow");
		arrow.style.transform = "rotate(" + degrees + "deg)";
		return arrow;
	},
	ocillator = (type, freq) => {
		const osc = audio.createOscillator();
		osc.type = type;
		osc.frequency.setValueAtTime(freq, audio.currentTime);
		return osc;
	},
	gain = rampEnd => {
		const amp = audio.createGain();
		amp.gain.value = 0.2;
		if (rampEnd) amp.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + rampEnd);
		return amp;
	},
	ocillate = (osc, amp, stop) => {
		if (!sound) return;
		osc.connect(amp).connect(audio.destination);
		osc.start();
		osc.stop(audio.currentTime + stop);
	},
	playPress = () => {
		const osc = ocillator("sine", 540),
			amp = gain(0.1);
		amp.gain.exponentialRampToValueAtTime(amp.gain.value, audio.currentTime);
		ocillate(osc, amp, 0.1);
	},
	playBuzzer = () => {
		ocillate(ocillator("sawtooth", 140), gain(), 0.6);
	},
	playSuccess = () => {
		let i = 0, id;
		const success = () => {
				++i;
				const osc = ocillator("sine", 1400),
					amp = gain(0.2);
				amp.gain.exponentialRampToValueAtTime(amp.gain.value, audio.currentTime);
				osc.frequency.exponentialRampToValueAtTime(2600, audio.currentTime + 0.2);
				ocillate(osc, amp, 0.09);
				if (i > 6) clearInterval(id);
			};
		success();
		id = setInterval(success, 98);
	},
	setup = data => {
		while (board.firstChild) board.firstChild.remove();
		if (data) return (board.className = version);
		let [a, b] = [1, 0];
		grid = Array.from({ length: minXY * maxXY }, () => {
			if (b === maxXY) [a, b] = [++a, 0];
			return matchMedia("(orientation: portrait)").matches ? (++b) + "/" + a : a + "/" + (++b);
		});
		numerals = Array.from({ length: level }, (v, i) => i + 1);
		board.className = "grid" + (/win/i.test(navigator.platform) ? " win-ui-font" : "");
		++rounds;
	},
	ctrl = (tag, items, cont, func, parentNode = board, pressed = 0) => {
		for (const [i, item] of items.entries()) {
			const el = create(tag, parentNode, item);
			el.textContent = cont[i];
			el.addEventListener("pointerdown", () => { playPress(); pressed = 1; });
			el.addEventListener("pointerup", () => { if (pressed) { pressed = 0; func[i](el); }});
		}
	},
	main = () => {
		setup(true);
		const help = el => {
				if (el.firstChild.nodeName === "ol") return (el.textContent = "?");
				el.firstChild.replaceWith(create("ol"));
				for (const txt of ["Start game", "Observe " + version.toLowerCase(), "Press the right order"]) create("li", el.firstChild).textContent = txt;
			},
			speaker = () => sound ? "🔊" : "🔇",
			toggle = () => { version = version === "Arrows" ? "Numerals" : "Arrows"; main(); },
			download = () => location.href = "https://github.com/fson4/fson4.github.io",
			fullscreen = () => {
				const el = board.parentNode;
				if (!(document.fullscreenElement || document.webkitFullscreenElement)) {
					if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
					else el.requestFullscreen();
				} else {
					if (document.webkitExitFullscreen) document.webkitExitFullscreen();
					else document.exitFullscreen();
				}
			};
		level = minLevel;
		[rounds, score] = [0, 0];
		ctrl("p", ["help", "toggle", "dwnl"], ["?", "!", "Download"], [el => { help(el); }, toggle, download]);
		ctrl("li", ["", "", ""], ["Easy", "Medium", "Hard"], Array(3).fill(el => { mode = el.textContent; start(); }), create("ul", board, "menu"));
		ctrl("div", ["speaker"], [speaker()], [el => { sound = sound ? 0 : 1; el.textContent = speaker(); }]);
		if (document.fullscreenEnabled || document.webkitFullscreenEnabled) ctrl("div", ["screen"], [""], [fullscreen]);
	},
	start = () => {
		setup(true);
		const setLevel = () => {
				level = level === maxLevel ? minLevel : ++level;
				[rounds, score] = [0, 0];
				start();
			};
		ctrl("p", ["level", "return"], ["Level " + level, "Return"], [setLevel, main]);
		ctrl("div", ["circle"], [""], [version === "Arrows" ? ARROWS : NUMERALS]);
		if (/0|1|Random/.test(reverse[version])) {
			reverse[version] = Math.floor(Math.random() * 2);
			const c = document.querySelector(".circle");
			void getComputedStyle(c).transform;
			c.className = "circle" + (reverse[version] ? " minus" : " plus");
		}
	},
	result = (box, item) => {
		const stats = () => Math.round((score / rounds) * 100) + "% (" + score + " / " + rounds + ")";
		if (!numerals.length) {
			start();
			++score;
			const ul = create("ul", board, "result success");
			for (const txt of ["- Well Played -", stats(), Math.round((time2 - time1) / 10) / 100 + " sec"]) create("li", ul).textContent = txt;
			playSuccess();
		} else {
			box.className = "box red";
			box.appendChild(item);
			playBuzzer();
			setTimeout(() => { start(); create("li", create("ul", board, "result")).textContent = stats(); }, 800);
		}
	},
	setBox = (item, i) => {
		const box = create("div", board, "box");
		box.style.gridArea = grid.splice(Math.floor(Math.random() * grid.length), 1)[0];
		box.setAttribute("data-index", numerals[i]);
		box.appendChild(item);
	},
	mask = () => {
		time2 = Date.now();
		for (const box of board.getElementsByClassName("box")) {
			box.firstChild.remove();
			box.className = "box mask";
		}
		board.addEventListener("pointerdown", unmask);
	},
	unmask = (e, box = e.target.closest(".mask")) => {
		if (!box) return;
		box.className = "box";
		const index = Number(box.getAttribute("data-index"));
		if (index !== numerals.splice(numerals.indexOf(reverse[version] ? Math.max(...numerals) : Math.min(...numerals)), 1)[0] || !numerals.length) {
			board.removeEventListener("pointerdown", unmask);
			result(box, version === "Arrows" ? arrows[index - 1] : document.createTextNode(index));
		} else playPress();
	},
	masker = (e, box = e.target.closest(".box")) => {
		if (!box) return;
		board.removeEventListener("pointerdown", masker);
		mask();
		unmask(e, box);
	},
	setMask = () => {
		time1 = Date.now();
		if (mode !== "Easy") setTimeout(mask, time());
		else board.addEventListener("pointerdown", masker);
	},
	NUMERALS = () => {
		setup();
		if (randomize) {
			const range = Array.from({ length: maxLevel }, (v, i) => i + 1);
			for (let i = 0; i < level; ++i) numerals[i] = range.splice(Math.floor(Math.random() * range.length), 1)[0];
		}
		for (let i = 0; i < level; ++i) setBox(document.createTextNode(numerals[i]), i);
		setMask();
	},
	ARROWS = () => {
		setup();
		const sector = Number((360 / level).toFixed(2));
		arrows = [];
		for (let i = 0, deg = randomize ? (sector - 4) : sector; i < level; ++i, deg += sector) {
			const arrow = createArrow(Math.round(randomize ? deg - Math.floor(Math.random() * (sector - 7)) : deg - (sector / 2)));
			arrows.push(arrow);
			setBox(arrow, i);
		}
		setMask();
	};
addEventListener("DOMContentLoaded", () => { board = document.body; main(); }, { once: true });
addEventListener("load", () => { if ("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js"); }, { once: true });
