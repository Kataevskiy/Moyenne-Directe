let s = document.createElement("script");
s.src = chrome.extension.getURL("main.js");
document.head.appendChild(s);
s.onload = function () {
    s.parentNode.removeChild(s);
}