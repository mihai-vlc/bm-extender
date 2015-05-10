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
    // on the BM site
    appendScript('scripts/fixDW.js');
    appendStyle('styles/fixDW.css');

} else if (location.pathname.indexOf('on/demandware.store/Sites-') > -1
    || location.pathname.indexOf('demandware.net/s/') > -1) {
    // on the storefront
    appendScript('scripts/requestLog.js');

} else if (location.pathname.indexOf('on/demandware.servlet/webdav/Sites/Logs/') > -1) {
    // on the logs page
    appendScript('scripts/formatLogs.js');
    appendStyle('styles/highlighter.css');
}
