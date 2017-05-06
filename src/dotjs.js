var appendScript = function(path){
    var xhr = new XMLHttpRequest();
    xhr.onload = function(){
        eval(this.responseText);
    }
    xhr.open('GET', chrome.extension.getURL(path));
    xhr.send();
}

var appendScriptInDocument = function(path, cb){
    var script = document.createElement('script');
    script.src = chrome.extension.getURL(path);
    script.onload = cb || $.noop;
    document.body.appendChild(script);
}

var appendStyle = function (path) {
    var defaultStyle = document.createElement('link');
    defaultStyle.rel = 'stylesheet';
    defaultStyle.href = chrome.extension.getURL(path);
    document.head.appendChild(defaultStyle);
}

var includedDomains = (localStorage.getItem('bm-extender-included-domains') || '').split(',');

if (location.pathname.indexOf('on/demandware.store/Sites-Site') > -1) {
    // on the BM site
    appendScriptInDocument('scripts/fixDW-libs.js', function() {
        appendScriptInDocument('scripts/fixDW.js');
    });
    appendStyle('styles/fixDW.css');
    appendScript('scripts/requestLog.js');

} else if (location.pathname.indexOf('on/demandware.store/Sites-') > -1
    || location.href.indexOf('demandware.net/s/') > -1 || includedDomains.indexOf(location.host) > -1) {
    // on the storefront
    appendScript('scripts/requestLog.js');

} else if (location.pathname.indexOf('on/demandware.servlet/webdav/Sites/Logs/') > -1) {
    // on the logs page
    appendScript('scripts/formatLogs.js');
    appendStyle('styles/highlighter.css');
}
