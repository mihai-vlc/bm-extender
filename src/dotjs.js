(function () {
    function loadApplication(appOptions) {
        var appendScriptInDocument = function (path, cb) {
            initializeOptions(appOptions);
            var script = document.createElement("script");
            script.src = chrome.runtime.getURL(path);
            script.onload = cb || $.noop;
            document.body.appendChild(script);
        };

        var appendStyle = function (path) {
            var defaultStyle = document.createElement("link");
            defaultStyle.rel = "stylesheet";
            defaultStyle.href = chrome.runtime.getURL(path);
            document.head.appendChild(defaultStyle);
        };

        var includedDomains = (appOptions.includedDomains || "").split(/,|\r\n|\n/g);

        if (location.pathname.indexOf("on/demandware.store/Sites-Site") > -1) {
            // on the BM site
            appendScriptInDocument("scripts/fixDW-libs.js", function () {
                appendScriptInDocument("scripts/fixDW.js");
            });
            appendStyle("styles/fixDW.css");
            loadContentScript("scripts/requestLog.js");
        } else if (isStorefrontSite(includedDomains)) {
            // on the storefront
            loadContentScript("scripts/requestLog.js");
        } else if (location.pathname.indexOf("on/demandware.servlet/webdav/Sites/Logs/") > -1) {
            // on the logs page
            loadContentScript("scripts/formatLogs.js");
            appendStyle("styles/highlighter.css");
        }
    }

    function loadContentScript(scriptPath) {
        chrome.runtime.sendMessage({
            type: "loadContentScript",
            scriptPath: scriptPath,
        });
    }

    function isStorefrontSite(includedDomains) {
        if (location.pathname.indexOf("on/demandware.store/Sites-") > -1) {
            return true;
        }

        if (location.href.indexOf("demandware.net/s/") > -1) {
            return true;
        }

        if (includedDomains.indexOf(location.host) > -1) {
            return true;
        }
    }

    function initializeOptions(appOptions) {
        if (document.getElementById("bm-extender-app-options")) {
            return;
        }

        var optionsHolder = document.createElement("div");
        optionsHolder.setAttribute("id", "bm-extender-app-options");
        optionsHolder.setAttribute("data-options", JSON.stringify(appOptions));

        document.body.appendChild(optionsHolder);
    }

    chrome.storage.sync
        .get({
            includedDomains: "",
            logsReplaceEscaped: false,
            disableSidebar: false,
            darkModeBm: false,
        })
        .then(loadApplication);
})();
