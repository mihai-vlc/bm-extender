(function ($) {
    var win = chrome.extension.getBackgroundPage();
    var pageUrl = new URL(window.location.href);

    win.background.getLogTail(pageUrl.searchParams.get('logPath'), function (response) {
    	$('.js-log-data').html(response);
    });

})(jQuery);
