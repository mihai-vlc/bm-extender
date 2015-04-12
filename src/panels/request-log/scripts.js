(function () {
    var app = {
        port: false,
        $checkbox: false,
        $logs: false,
        init : function () {
            app.port = chrome.runtime.connect({name: "panel"});
            app.$checkbox = $('.js-enable');
            app.$logs = $('.js-logs');
            app.$open = $('.js-open');

            app.port.onMessage.addListener(function(msg) {
                if (typeof msg.fn == 'undefined') {
                    return;
                }
                var data = msg.data || [];
                app[msg.fn].apply(this, msg.data);
            });

            app.setListeners();
        },
        setStatus: function (status) {
            app.$checkbox.prop('checked', status);
        },
        setLogs: function (logs) {
            app.$logs.empty();
            var select = app.$logs[0];

            logs.forEach(function (log) {
                var text = log.split('/').pop();
                select.add( new Option(text, log) );
            });
        },
        setListeners: function () {

            app.$checkbox.on('change', function () {

                app.port.postMessage({
                    fn: 'setStatus',
                    data: [this.checked]
                });

                if ( ! this.checked) {
                    app.$logs.empty();
                }

            });

            app.$open.on('click', function () {
                var url = app.$logs.val();
                app.port.postMessage({
                    fn: 'openTab',
                    data: [url]
                });
            });
        }
    };


    app.init();


})();




