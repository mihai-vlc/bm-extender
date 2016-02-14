(function () {

    var url = 'https://' + window.location.host + '/on/demandware.servlet/webdav/Sites/Logs';


    var port = chrome.runtime.connect({name: "reqLog"});

    port.onMessage.addListener(function(msg) {
        if (msg.fn == 'getLinks') {
            getLinks(function (links) {
                port.postMessage({
                    fn: 'setLinks',
                    data: [links, window.location.host]
                });
            });
        }

    });



    function getLinks(callback) {
        $.ajax({
            url: url,
            success: function (data) {
                var d = new Date();
                var year = d.getFullYear().toString();
                var month = ('0' + (d.getMonth()+1)).slice(-2);
                var day = ('0' + d.getDate()).slice(-2);

                var date = year + month + day;
                var links = [];

                $(data).find('a[href*="' + date + '"]').each(function () {
                    links.push(this.href.replace(/http:/g, 'https:'));
                });

                callback(links);

            }
        });
    }



})();

