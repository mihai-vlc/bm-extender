(function () {
    var $el = $('body > pre');

    if (!$el.length) {
        return;
    }

    var appOptions = $('#bm-extender-app-options').data('options') || {};

    var text = $el.html();

    var start = new Date();

    var currentDate = new Date();

    currentDate.setMinutes(currentDate.getMinutes() + currentDate.getTimezoneOffset());

    var year = currentDate.getFullYear();
    var month = pad(currentDate.getMonth()+1);
    var day = pad(currentDate.getDate());
    var hour = pad(currentDate.getHours());
    var minute = currentDate.getMinutes();


    // last 5 minutes
    var minutesPattern = pad(minute) + '|' + pad(minute - 1) + '|' + pad(minute - 2) +
                '|' + pad(minute - 3) + '|' + pad(minute - 4)  + '|' + pad(minute - 5);

    var newLogsPattern = new RegExp('(\\[' + year + '-' + month + '-' +
            day + ' ' + hour + ':(' + minutesPattern + '):\\d+\.\\d+ GMT\\])', 'gm');

    text = text.replace(/(^\[.+?\])/gm, '</div><div class="section"><b class="token selector block-separator italic">$1</b>');
    text = text.replace(newLogsPattern, '(NEW) <b class="token number">$1</b>');
    text = text.replace(/(WARN|warning|DEBUG|INFO)/gm, '<b class="token important italic">$1</b>');
    text = text.replace(/(ERROR)/gm, '<b class="token danger italic">$1</b>');
    text = text.replace(/(Sites\-([\w-]+)?Site)/gm, '<b class="token keyword italic">$1</b>');
    text = text.replace(/\|(\w+-\w+)\|/gm, '|<b class="token function">$1</b>|');
    text = text.replace(/(^\tat.+$)/gmi, '<small class="token small">$1</small>');
    text = text.replace(/((\#|lineNumber: |line )\d+)/gmi, '<b class="token number">$1</b>');
    text = text.replace(/(null|TypeError|ReferenceError| custom |importPackage|require)/gmi, '<b class="token keyword">$1</b>');
    text = text.replace(/(\w+\.(isml|jpg|png|js|ds))/gmi, '<b class="token string">$1</b>');
    text = text.replace(/\[Template:([a-z0-9\/]+):/gmi, '[Template:<b class="token string">$1</b>:');
    text = text.replace(/\[Pipeline:([a-z]+):/gmi, '[Pipeline:<b class="token string">$1</b>:');

    if (appOptions.logsReplaceEscaped == 'true') {
        text = text.replace(/&amp;gt;/gmi, '&gt;');
        text = text.replace(/&amp;lt;/gmi, '&lt;');
        text = text.replace(/&amp;quot;/gmi, '&quot;');
    }



    $el.addClass('language-log')
        .html('<code><div class="section"><h1>DW LOGS</h1>' + text + '</div></code>');

    var totalTime = (new Date()) - start;
    console.log('BM Extender: The logs parsing took %s ms !', totalTime);
    console.log('BM extender: sessionStorage.setItem("bm-logs-replace-escaped", 1)');

    // scroll to the bottom of the document
    $(window).on('load', function () {
        setTimeout(function () {
            $("html, body").animate({ scrollTop: $(document).height() }, 500);
        }, 200);
    });

    function pad(number) {
        return ('0' + number).slice(-2);
    }

})();
