// ==UserScript==
// @name        Github+ | Reveal Header
// @namespace   thenolle.studios.github.plus

// @copyright    2020, TheNolle Studios
// @license      GPL-3.0-or-later; http://www.gnu.org/licenses/gpl-3.0.txt
// @version      Alpha.0.5.2-(Pre.Alpha)

// @author       TheNolle Studios
// @description           Improves Github in a way you may like it.

// @supportURL   https://github.com/TheNolle/Github-Plus/issues/new/choose
// @updateURL    https://github.com/TheNolle/Github-Plus/raw/master/Reveal%20Header/userscript.user.js
// @downloadURL  https://github.com/TheNolle/Github-Plus/raw/master/Reveal%20Header/userscript.user.js

// @include     https://github.com/*
// @include     https://gist.github.com/*

// @require     https://greasyfork.org/scripts/28721-mutations/code/mutations.js?version=666427

// @grant       GM_addStyle

// @run-at      document-idle
// ==/UserScript==

  // Create a new localStorage + Displays an Alert Box on First Use
    var FirstUse = localStorage.getItem('FirstUse') || '';
    if (FirstUse != 'No') {
     alert(`_________________________________________________________________________
                                Thank you for using our script!
You can join our Discord (https://discord.gg/yUgp7k8) to support us!
And also that if you encounter any bugs with our script, you can leave a [Bug Report] on the github (https://github.com/TheNolle)
                                                                                - TheNolle Studios
_________________________________________________________________________
`);
     localStorage.setItem('FirstUse','No');
    }

(() => {
	"use strict";

	const topZone = 75, // px from the top of the viewport (add
		transitionDelay = 200,  // ms before header hides
		revealAttr = "data-reveal-header", // attribute added to minimize redraw

		// body class names to trigger animation
		revealStart = "reveal-header-start",
		revealAnimate = "reveal-animated",

		// selectors from https://github.com/StylishThemes/GitHub-FixedHeader
		headers = [
			// .header = logged-in
			"body{attr}.logged-in .header",
			// .site-header = not-logged-in (removed 8/2017)
			"{attr} .site-header",
			// .Header = logged-in or not-logged-in (added 8/2017)
			"{attr} .Header",
			// .Header removed, use .js-header-wrapper with header/.Header-old (3/2019)
			"{attr} .js-header-wrapper header",
			// #com #header = help.github.com
			"{attr} #com #header"
			// extra
		],
		$body = $("body");

	let timer, timer2;

	GM_addStyle(`
		${headers.join(",").replace(/\{attr}/g, "")} {
			width: 100%;
			z-index: 1000;
		}
		${headers.join(",").replace(/\{attr}/g, `.${revealAnimate}`)} {
			-webkit-transition: transform ease-in ${transitionDelay}ms,
				marginTop ease-in ${transitionDelay}ms;
			transition: transform ease-in ${transitionDelay}ms,
				marginTop ease-in ${transitionDelay}ms;
		}
		${headers.join(",").replace(/\{attr}/g, `.${revealStart}`)} {
			position: fixed;
			transform: translate3d(0, -100%, 0);
		}
		${headers.join(",").replace(/\{attr}/g, `[${revealAttr}]`)} {
			position: fixed;
			transform: translate3d(0, 0%, 0);
		}
		body.${revealAnimate} {
			-webkit-transition: marginTop ease-in ${transitionDelay}ms;
			transition: marginTop ease-in ${transitionDelay}ms;
		}
	`);

	function getHeader() {
		return $(`${headers.join(",").replace(/\{attr}/g, "")}`);
	}

	function getScrollTop() {
		// needed for Chrome/Firefox
		return window.pageYOffset ||
			document.documentElement.scrollTop ||
			document.body.scrollTop || 0;
	}

	function onTransitionEnd(el, callback) {
		const listener = () => {
			callback();
			// remove listener after event fired
			el.removeEventListener("transitionend", listener);
			el.removeEventListener("webkitTransitionEnd", listener);
		};
		el.addEventListener("transitionend", listener);
		el.addEventListener("webkitTransitionEnd", listener);
	}

	// A margin top is needed to prevent
	function clearMarginTop() {
		const $header = getHeader();
		$body.style.marginTop = "";
		if ($header) {
			$header.style.marginTop = "";
		}
	}

	function slideDown(event) {
		if (event.clientY < topZone) {
			const $header = getHeader();
			if ($header) {
				onTransitionEnd($header, () => {
					$body.classList.remove(revealStart);
				});
				// add 1px for the border
				const headerHeight = ($header.clientHeight + 1) + "px";
				$body.style.marginTop = headerHeight;
				$header.style.marginTop = "-" + headerHeight;
			}

			// move header to start position instantly
			$body.classList.remove(revealAnimate);
			$body.classList.add(revealStart);
			clearTimeout(timer);
			timer = setTimeout(() => {
				$body.classList.add(revealAnimate);
				$body.setAttribute(revealAttr, true);
			}, transitionDelay * 0.2);
		}
	}

	function slideUp() {
		clearTimeout(timer);
		clearTimeout(timer2);
		if (getScrollTop() > topZone) {
			$body.classList.add(...[revealStart, revealAnimate]);
			onTransitionEnd(getHeader(), () => {
				$body.classList.remove(...[revealStart, revealAnimate]);
				clearMarginTop();
			});
		} else {
			clearMarginTop();
		}
		$body.removeAttribute(revealAttr);
	}

	function clearTimer() {
		clearTimeout(timer);
	}

	function mouseLeave(event) {
		clearTimeout(timer);
		// don't slideUp when "mouseleave" triggers on children in header
		if (event.target === getHeader()) {
			timer = setTimeout(() => {
				slideUp();
			}, transitionDelay * 1.2);
		}
	}

	function bindHeader() {
		const $header = getHeader();
		if ($header) {
			$header.removeEventListener("mouseenter", clearTimer);
			$header.removeEventListener("mouseleave", mouseLeave);
			$header.addEventListener("mouseenter", clearTimer);
			$header.addEventListener("mouseleave", mouseLeave);
		}
	}

	function init() {
		document.addEventListener("mousemove", event => {
			if (
				event.clientY < topZone &&
				getScrollTop() > topZone &&
				!$body.hasAttribute(revealAttr)
			) {
				clearTimeout(timer);
				timer = setTimeout(() => {
					slideDown(event);
				}, transitionDelay * 0.2);
			}
			clearTimeout(timer2);
			// check location of mouse... if outside of header, slideUp
			timer2 = setTimeout(() => {
				const el = document.elementFromPoint(event.clientX, event.clientY);
				if (
					$body.hasAttribute(revealAttr) &&
					!closest(`${headers.join(",").replace(/\{attr}/g, "")}`, el)
				) {
					slideUp();
				}
			}, 2000);
		});
		document.addEventListener("mouseleave", () => {
			if ($body.hasAttribute(revealAttr)) {
				slideUp();
			}
		});
		bindHeader();
	}

	function $(str, el) {
		return (el || document).querySelector(str);
	}

	function closest(selector, el) {
		while (el && el.nodeType === 1) {
			if (el.matches(selector)) {
				return el;
			}
			el = el.parentNode;
		}
		return null;
	}

	document.addEventListener("ghmo:container", bindHeader);
	init();

})();
