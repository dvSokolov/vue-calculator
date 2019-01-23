const floatRegExp = /^$|^[+-]?\d+(\.\d+)?$/
function validateFloat (value) {
    floatRegExp.lastIndex = 0
    return floatRegExp.test(value)
}

const spaceRegExp = /\s/g
function removeSpaces (value) {
    spaceRegExp.lastIndex = 0
    return value.toString().replace(spaceRegExp, '')
}

const integerRegExp = /^$|^[+-]?\d+$/
function validateInteger (value) {
    integerRegExp.lastIndex = 0
    return integerRegExp.test(value)
}

const notIntegerRegExp = /\D|^(0)\d+|^([\d]{9})\d+/
function removeNotInteger (value) {
    notIntegerRegExp.lastIndex = 0
    return value.toString().replace(notIntegerRegExp, function (str, p1, p2, offset, s) {
        return (p1 || p2 || '')
    })
}

const costRegExp = /^$|^[\d]{1,9}$/
const doubleZeroRegExp = /^0\d+/
function validateCost (value) {
    costRegExp.lastIndex = 0;
	doubleZeroRegExp.lastIndex = 0;
	
	return (costRegExp.test(value))
		? (!doubleZeroRegExp.test(value))
		: false;
}

function sumSplit(value) {
    value = value.toString().replace(/[^0-9]/ig,"");
    return (value + "").split("").reverse().join("").replace(/(\d{3})/g, "$1 ").split("").reverse().join("").replace(/^ /, "");
}

export {removeSpaces, removeNotInteger, sumSplit, validateCost}
