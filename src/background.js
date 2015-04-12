var background = {
    status: false,
    pagePort: false,
    panelPort: false,
    links: false,
    init: function () {

        chrome.runtime.onConnect.addListener(function(port) {

            background.initPage(port);
            background.initPanel(port);

            port.onMessage.addListener(function(msg) {
                if (typeof msg.fn == 'undefined') {
                    return;
                }
                var data = msg.data || [];
                background[msg.fn].apply(this, msg.data);
            });



        });

    },
    openTab: function (url) {
        chrome.tabs.create({ url: url });
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
    setLinks: function (links, update) {
        background.links = links;
        if (update) {
            background.updateLinks(links);
        }
    },
    updateLinks: function (links) {
        if (background.panelPort) {
            background.panelPort.postMessage({
                fn: 'setLogs',
                data: [links]
            });
        }
    },
    initPanel: function (port) {
        if (port.name != 'panel') {
            return;
        }

        if (background.panelPort) {
            background.panelPort.disconnect();
        }

        background.panelPort = port;


        background.panelPort.postMessage({
            fn: 'setStatus',
            data: [background.status]
        });

        if (background.links && background.status) {
            background.updateLinks(background.links);
        }

    },
    setStatus: function (status) {
        background.status = status;
    }
};


background.init();

