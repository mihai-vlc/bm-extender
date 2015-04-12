var appendScript = function(path){
	var xhr = new XMLHttpRequest();
	xhr.onload = function(){
		eval(this.responseText);
	}
	xhr.open('GET', chrome.extension.getURL(path));
	xhr.send();
}

var appendStyle = function (path) {
    var defaultStyle = document.createElement('link');
    defaultStyle.rel = 'stylesheet';
    defaultStyle.href = chrome.extension.getURL(path);
    document.head.appendChild(defaultStyle);
}


if (location.pathname.indexOf('on/demandware.store/Sites-Site') > -1) {
    appendScript('scripts/fixDW.js');
    appendStyle('styles/fixDW.css');
} else if (location.pathname.indexOf('on/demandware.store/Sites-') > -1) {
    appendScript('scripts/requestLog.js');
} else if (location.pathname.indexOf('on/demandware.servlet/webdav/Sites/Logs/') > -1) {
    appendScript('scripts/formatLogs.js');
    appendStyle('styles/highlighter.css');
}
