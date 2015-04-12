(function () {
    var win = chrome.extension.getBackgroundPage();
    var $list = $('.js-loglist');
    var html = '';

    $('.js-enable')
        .on('change', function () {
            win.background.status = this.checked;
            window.close();
        })
        .prop('checked', win.background.status);

    if (win.background.status && win.background.links) {
        win.background.links.forEach(function (link) {
            var name = link.split('/').pop();
            html += '<li><a href="'+link+'">' + name + '</a></li>';
        });
        $list.html(html);
    }

    $('a').on('click', function () {
        chrome.tabs.create({ url: this.href });
    });


})();

