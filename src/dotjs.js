(function () {
/*global chrome*/

    function loadApplication(appOptions) {

        var appendScript = function(path, cb) {
            initializeOptions(appOptions);
            var xhr = new XMLHttpRequest();
            xhr.onload = function(){
                eval(this.responseText);
                if (cb) {
                    cb();
                }
            }
            xhr.open('GET', chrome.extension.getURL(path));
            xhr.send();
        }

        var appendScriptInDocument = function(path, cb){
            initializeOptions(appOptions);
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

        var includedDomains = (appOptions.includedDomains || '').split(/,|\r\n|\n/g);

        if (location.pathname.indexOf('on/demandware.store/Sites-Site') > -1) {
            // on the BM site
            appendScript('scripts/fixDW-libs.js', function () {
                appendScript('scripts/fixDW.js');
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
    }


    function initializeOptions(appOptions) {
        if (document.getElementById('bm-extender-app-options')) {
            return;
        }

        var optionsHolder = document.createElement('div');
        optionsHolder.setAttribute('id', 'bm-extender-app-options');
        optionsHolder.setAttribute('data-options', JSON.stringify(appOptions));

        document.body.appendChild(optionsHolder);
    }

    chrome.storage.sync.get({
        includedDomains: '',
        logsReplaceEscaped: false,
        disableSidebar: false
    }, loadApplication);

})();
