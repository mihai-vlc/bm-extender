(function () {
    var win = chrome.extension.getBackgroundPage();
    var $list = $('.js-loglist');
    var html = '';

    /**
     * we place the url on the background page window so it will always
     * remember the last demandware url visited
     */
    chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
        if (! isDWUrl(tabs[0].url)) {
            return;
        }

        var a = document.createElement("a");
        a.href = tabs[0].url;
        win.baseUrl = 'https://' + a.hostname;

    });


    // list the log files from the current date
    win.background.getLinks(function (links, box) {
        links.forEach(function (link) {
            var name = link.split('/').pop();
            html += '<li><a href="'+link+'">' + name + '</a></li>';
        });

        $list.html(html);
        $('.js-base-url').html(box);
    });


    $(document).on('click', 'a', function () {
        var url;

        if ($(this).hasClass('js-base-link') && win.baseUrl) {
            url = win.baseUrl + this.pathname;
        } else {
            url = this.href;
        }

        if ($(this).hasClass('js-window')) {
            chrome.windows.create({ url: url, type: 'popup', width: 700 });
        } else {
            chrome.tabs.create({ url: url });
        }
    });


    function isDWUrl(url) {
        return url.indexOf('.demandware.net/') > -1;
    }

})();

