(function () {
    var $el = $('body > pre');
    var text = $el.html();

    var d = new Date();

    var year = d.getFullYear();
    var month = pad(d.getMonth()+1);
    var day = pad(d.getDate());
    var hour = pad(d.getHours() + d.getTimezoneOffset()/60);
    var minute = d.getMinutes();

    var minutesPattern = pad(minute) + '|' + pad(minute-1) + '|' + pad(minute-2) +
                '|' + pad(minute-3) + '|' + pad(minute-4)  + '|' + pad(minute-5);

    var pattern = new RegExp('(\\[' + year + '-' + month + '-' +
            day + ' ' + hour + ':(' + minutesPattern + '):\\d+\.\\d+ GMT\\])', 'gm');



    text = text.replace(/(^\[.+?\])/gm, '</div><div class="section"><b class="token selector block-separator italic">$1</b>');
    text = text.replace(pattern, '(NEW) <b class="token number">$1</b>');
    text = text.replace(/(WARN|warning)/gm, '<b class="token important italic">$1</b>');
    text = text.replace(/(ERROR)/gm, '<b class="token danger italic">$1</b>');
    text = text.replace(/(Sites\-(\w+-)?Site)/gm, '<b class="token keyword italic">$1</b>');
    text = text.replace(/(\/\w[^ ]+?\.[a-z]+)/gmi, '<b class="token url">$1</b>');
    text = text.replace(/(\/\w+\.[a-z]+)/gmi, '<b class="token string">$1</b>');
    text = text.replace(/(^\tat.+$)/gmi, '<small class="token small">$1</small>');
    text = text.replace(/((\#|lineNumber: |line )\d+)/gmi, '<b class="token number">$1</b>');
    text = text.replace(/(null|TypeError|ReferenceError)/gmi, '<b class="token keyword">$1</b>');



    $el.addClass('language-log')
        .html('<code><div class="section"><h1>DW LOGS</h1>' + text + '</div></code>');

    // scroll to the bottom of the document
    $(window).on('load', function () {
        setTimeout(function () {
            $("html, body").animate({ scrollTop: $(document).height() }, 500);
        }, 100);
    });

    function pad(number) {
        return ('0' + number).slice(-2);
    }

})();
