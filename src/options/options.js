(function () {

    function loadApplication(appOptions) {
        var $form = $('.js-options-form');

        $form.on('submit', function (event) {
            event.preventDefault();

            saveOptions($form);
        });

        populateForm($form, appOptions);

    }

    function populateForm($form, appOptions) {
        Object.keys(appOptions).forEach(key => {
            $form.find(`[name='${key}']`).each(function () {
                var $element = $(this);

                if ($element.is(':checkbox')) {
                    $(this).prop('checked', appOptions[key]);
                } else {
                    $(this).val(appOptions[key]);
                }
            });
        });
    }

    function saveOptions($form) {
        var options = {};

        getSerializedForm($form).forEach(item => {
            options[item.name] = item.value;
        });

        chrome.storage.sync.set(options, function () {
            alert('The options were saved');
        });
    }

    function getSerializedForm($form) {
        var serializedForm = $form.serializeArray();
        var checkboxes = $form.find('input[type=checkbox]:not(:checked)').map(function() {
            return {"name": this.name, "value": false};
        }).get();

        serializedForm = serializedForm.concat(checkboxes).map(function (field) {
            var value = field.value;

            if (value === 'true' || value === 'false') {
                value = Boolean(value);
            }

            return {
                name: field.name,
                value: value
            };
        });

        return serializedForm;
    }

    chrome.storage.sync.get({
        includedDomains: '',
        logsReplaceEscaped: false,
        disableSidebar: false,
        disableBackgroundSiteChange: false
    }, loadApplication);

})();
