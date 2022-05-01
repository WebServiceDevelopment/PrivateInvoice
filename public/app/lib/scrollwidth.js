"use strict";

(function() {

	let outer = document.createElement("div");
	outer.style.visibility = "hidden";
	outer.style.width = "100px";
	outer.style.msOverflowStyle = "scrollbar";

	document.body.appendChild(outer);
	let widthNoScroll = outer.offsetWidth;
	outer.style.overflow = "scroll";

	let inner = document.createElement("div");
	inner.style.width = "100%";
	outer.appendChild(inner);
	let widthWithScroll = inner.offsetWidth;
	outer.parentNode.removeChild(outer);

	const style = document.createElement("style");
	const sw = widthNoScroll - widthWithScroll;

	const NODE_TEXT = `html { --scroll-width : ${sw}px; }`;
	const node = document.createTextNode(NODE_TEXT);
	style.appendChild(node);
	document.head.appendChild(style);


})();
