(function () {
    var $el = $('body > pre');
    var text = $el.html();

    var d = new Date();

    var year = d.getFullYear();
    var month = ('0' + (d.getMonth()+1)).slice(-2);
    var day = ('0' + d.getDate()).slice(-2);
    var hour = ('0' + (d.getHours() + d.getTimezoneOffset()/60)).slice(-2);
    var minute = d.getMinutes();


    var pattern = new RegExp('(' + year + '-' + month + '-' +
            day + ' ' + hour + ':(' +
                minute + '|' + (minute-1) + '|' + (minute-2) +
                '|' + (minute-3) + '|' + (minute-4)  + '|' + (minute-5) +
            '):)', 'gm');

    text = text.replace(pattern, '<b class="token number">$1</b>');


    text = text.replace(/(^\[.+?\])/gm, '<b class="token selector block-separator italic">$1</b>');
    text = text.replace(/(WARN|warning)/gm, '<b class="token important italic">$1</b>');
    text = text.replace(/(ERROR)/gm, '<b class="token danger italic">$1</b>');
    text = text.replace(/(Sites\-(\w+-)?Site)/gm, '<b class="token keyword italic">$1</b>');
    text = text.replace(/(\/\w[^ ]+?\.[a-z]+)/gmi, '<b class="token url">$1</b>');
    text = text.replace(/(\/\w+\.[a-z]+)/gmi, '<b class="token keyword">$1</b>');
    text = text.replace(/(^\tat.+$)/gmi, '<small class="token small">$1</small>');



    $el.addClass('language-log')
        .html('<code>' + text + '</code>');

})();
