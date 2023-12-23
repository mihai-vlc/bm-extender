(async function () {
    console.log("Hello darkness my old friend");

    try {



        let sfccTabData = await chrome.runtime.sendMessage({
            type: "getSFCCTabData",
        });

        if (!sfccTabData || !sfccTabData.id) {
            $('.app-status').html("No active SFCC tabs found");
        }

        // console.log(sfccTabData);
        $('.js-instance-name').text(sfccTabData.url);

        initSelect(sfccTabData.url);

    } catch (e) {
        $('.app-status').html(e);
    }

    function initSelect(baseUrl) {
        /* global Choices */
        const choices = new Choices('.js-all-log-files', {
            removeItemButton: true,
            searchResultLimit: 999999,
            allowHTML: false,
            shouldSort: false,
            fuseOptions: {
                includeScore: true
            }
        });

        choices.setChoices(async () => {
            const logListResponse = await fetch(baseUrl + "/on/demandware.servlet/webdav/Sites/Logs");
            const logsList = await logListResponse.text();

            var groups = {};
            $(logsList).find('a[href$=".log"]').each(function () {
                const logFileName = this.href.split('/').pop();
                const groupMatch = logFileName.match(/(\d{8})\.log$/);
                let groupId = '0';
                if (groupMatch) {
                    groupId = groupMatch[1];
                }

                groups[groupId] = groups[groupId] || [];

                groups[groupId].push({
                    label: logFileName,
                    value: logFileName
                });
            });
            return Object.keys(groups).toReversed().map((groupId) => {
                return {
                    label: groupId,
                    choices: groups[groupId]
                };
            });
        });
    }

})();
