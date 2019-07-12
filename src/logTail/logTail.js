(function ($) {
    var win = chrome.extension.getBackgroundPage();
    var pageUrl = new URL(window.location.href);
    var logSize = 10000;
    var logPath = pageUrl.searchParams.get('logPath');

	win.background.getLogTail(logPath, logSize, handleLogLoaded);

    appendStyle('styles/highlighter.css');


    $('.js-load-more').on('click', function (e) {
    	e.preventDefault();
    	logSize = logSize + 10000;

    	win.background.getLogTail(logPath, logSize, handleLogLoaded);
    });

    function handleLogLoaded(response) {
    	$('.js-log-data').html(response);

	    appendScriptInDocument('scripts/formatLogs.js');
    }

    function appendStyle(path) {
        var defaultStyle = document.createElement('link');
        defaultStyle.rel = 'stylesheet';
        defaultStyle.href = chrome.extension.getURL(path);
        document.head.appendChild(defaultStyle);
    }

    function appendScriptInDocument(path, cb){
        var script = document.createElement('script');
        script.src = chrome.extension.getURL(path);
        script.onload = cb || $.noop;
        document.body.appendChild(script);
    }



})(jQuery);
