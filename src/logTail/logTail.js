(async function ($) {
    var pageUrl = new URL(window.location.href);
    var logSize = 20000;
    var logPath = pageUrl.searchParams.get('logPath');

    let sfccTabData = null;

    try {
        // last accessed SFCC tab
        sfccTabData = await chrome.runtime.sendMessage({ type: "getSFCCTabData" });

        if (!sfccTabData) {
            $('.js-log-data').html("No active SFCC tabs were found");
            return;
        }

        const logContent = await chrome.tabs.sendMessage(sfccTabData.id, {
            type: "fetchLogTail",
            url: logPath,
            size: logSize
        });

        if (!logContent) {
            $('.js-log-data').html("Failed to fetch the log content");
            return;
        }

        handleLogLoaded(logContent);
    }
    catch (e) {
        $('.js-log-data').html(`<li>ERROR: ${e}</li>`);
        return;
    }

    appendStyle('styles/highlighter.css');


    $('.js-load-more').on('click', async function (e) {
        e.preventDefault();
        logSize = logSize + 20000;

        const logContent = await chrome.tabs.sendMessage(sfccTabData.id, {
            type: "fetchLogTail",
            url: logPath,
            size: logSize
        });

        if (!logContent) {
            $('.js-log-data').html("Failed to fetch the log content");
            return;
        }

        handleLogLoaded(logContent);
    });

    function handleLogLoaded(response) {
        $('.js-log-data').html(response);

        appendScriptInDocument('scripts/formatLogs.js');
    }

    function appendStyle(path) {
        var defaultStyle = document.createElement('link');
        defaultStyle.rel = 'stylesheet';
        defaultStyle.href = chrome.runtime.getURL(path);
        document.head.appendChild(defaultStyle);
    }

    function appendScriptInDocument(path, cb) {
        var script = document.createElement('script');
        script.src = chrome.runtime.getURL(path);
        script.onload = cb || $.noop;
        document.body.appendChild(script);
    }



})(jQuery);
