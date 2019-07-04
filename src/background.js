var baseIrl = null;
var background = {
    pagePort: null,
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
        if (port.name != 'reqLog') {
            return;
        }

        if (background.pagePort) {
            background.pagePort.disconnect();
        }

        background.pagePort = port;
    },

    setLinks: function (links, box) {
        publish('onLinks', [links, box]);
    },

    getLinks: function (cb) {
        if (background.pagePort) {
            try {
                background.pagePort.postMessage({
                    fn: 'getLinks'
                });
            } catch (e) {
                // disconnected port, log the error and open a new tab
                // to connect to a new port again
                console.error(e);
                if (window.baseUrl) {
                    chrome.tabs.create({
                        url: window.baseUrl + '/on/demandware.store/Sites-Site'
                    });
                }
            }
        }

        subscribe('onLinks', cb);
    }
};


background.init();



// https://github.com/daniellmb/MinPubSub/blob/master/minpubsub.js
(function(b){var a={},e=b.c_||{};a.publish=function(f,c){for(var a=e[f],d=a?a.length:0;d--;)a[d].apply(b,c||[])};a.subscribe=function(a,c){e[a]||(e[a]=[]);e[a].push(c);return[a,c]};a.unsubscribe=function(a,c){var b=e[c?a:a[0]];c=c||a[1];for(var d=b?b.length:0;d--;)b[d]===c&&b.splice(d,1)};"object"===typeof module&&module.exports?module.exports=exports=a:"function"===typeof define&&define.amd?define(function(){return a}):"object"===typeof b&&(b.publish=a.publish,b.subscribe=a.subscribe,b.unsubscribe=
a.unsubscribe)})(this.window);
