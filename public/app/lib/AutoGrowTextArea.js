// http://www.cryer.co.uk/resources/javascript/script21_auto_grow_text_box.htm

"use strict";

/*
function AutoGrowTextArea(textField) {

	// If the height is correct, then we don't need to do anything

	if (textField.clientHeight === textField.scrollHeight) {
		return;
	}

	// Otherwise, we need to change the size of the textarea to fit text

	textField.style.height = textField.scrollHeight + "px";
	if (textField.clientHeight < textField.scrollHeight) {
		textField.style.height = (textField.scrollHeight * 2 - textField.clientHeight) + "px";
	}

}
*/

autosize(document.getElementById('text'));
