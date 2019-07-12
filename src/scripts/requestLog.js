/*jshint esversion: 9 */
(function () {

    var logsPageUrl = 'https://' + window.location.host + '/on/demandware.servlet/webdav/Sites/Logs';


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

        if (msg.fn == 'fetchLogTail') {
            getLogTail(msg.data, function (response) {
                port.postMessage({
                    fn: 'setLogTail',
                    data: [response]
                });
            });
        }
    });

    function getLinks(callback) {
        $.ajax({
            url: logsPageUrl,
            success: function (data) {
                var d = new Date();
                d.setMinutes(d.getMinutes() + d.getTimezoneOffset());

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


    function getLogTail(options, callback) {
        var { url, size } = options;

        $.ajax({
            url: url,
            headers: {
                'Range': 'bytes=-' + (size || 10000)
            },
            success: function (response) {
                callback(response);
            },
            error: function (jqXHR) {
                if (!options.isRetry && jqXHR.status === 416) {
                    size = jqXHR.getResponseHeader('Content-Range').split('/')[1];
                    // attempt to load the full file
                    getLogTail({ ...options, size, isRetry: true }, callback);
                    return;
                }
                callback(`Failed to load ${url}`);
            }
        });

    }

})();

