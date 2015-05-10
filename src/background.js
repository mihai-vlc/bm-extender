var background = {
    status: false,
    pagePort: false,
    panelPort: false,
    links: false,
    init: function () {

        chrome.runtime.onConnect.addListener(function(port) {

            background.initPage(port);

            port.onMessage.addListener(function(msg) {
                if (typeof msg.fn == 'undefined') {
                    return;
                }
                var data = msg.data || [];
                background[msg.fn].apply(this, msg.data);
            });

        });

    },
    initPage: function (port) {
        if (port.name != 'page') {
            return;
        }

        if (background.pagePort) {
            background.pagePort.disconnect();
        }

        background.pagePort = port;

        if (background.status) {
            port.postMessage({
                fn: 'getLinks'
            });
        }

    },
    setLinks: function (links) {
        background.links = links;
    }
};


background.init();

