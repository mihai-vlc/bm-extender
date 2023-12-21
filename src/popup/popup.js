(async function () {
    var $filterInput = $(".js-filter-logs");
    let logsData = null;
    let sfccTabData = null;

    renderExtensionVersion();

    try {
        // last accessed SFCC tab
        sfccTabData = await chrome.runtime.sendMessage({ type: "getSFCCTabData" });

        if (!sfccTabData || !sfccTabData.id) {
            $(".js-loglist").html(`<li>No active SFCC tab found</li>`);
            return;
        }

        logsData = await chrome.tabs.sendMessage(sfccTabData.id, {
            type: "getLogsData",
        });

        if (!logsData) {
            $(".js-loglist").html(`<li>No logs found</li>`);
            return;
        }

        renderLogsList(logsData.links);
        $(".js-base-url").html(logsData.instanceHost);
    } catch (e) {
        $(".js-loglist").html(`
            <li>${e}</li>
            <li>Please make sure a SFCC instance is open is one of the tabs</li>
        `);

        if (e.toString().includes("Receiving end does not exist") && sfccTabData.url) {
            chrome.tabs.create({
                url:
                    sfccTabData.url +
                    "/on/demandware.store/Sites-Site/default/ViewApplication-DisplayWelcomePage",
            });
        }
        return;
    }

    $(document).on("click", "a", function (e) {
        e.preventDefault();
        var url;

        if ($(this).hasClass("js-options")) {
            openOptionsPage();
            return;
        }

        if ($(this).hasClass("js-open-tail-window")) {
            openTailLogWindow(this.href);
            return;
        }

        if ($(this).hasClass("js-base-link")) {
            url = sfccTabData.url + this.pathname;
        } else {
            url = this.href;
        }

        if ($(this).hasClass("js-window")) {
            chrome.windows.create({
                url: url,
                type: "popup",
                width: 700,
            });
        } else {
            chrome.tabs.create({ url: url });
        }
    });

    $filterInput.on("input", function () {
        renderLogsList(logsData.links);
    });

    function renderLogsList(activeLinks) {
        var $list = $(".js-loglist");

        if (!activeLinks) {
            $list.html("<li>No logs found</li>");
            return;
        }

        var query = $filterInput.val().toLowerCase();
        var queryRegex = new RegExp(query, "i");
        var html = "";

        activeLinks
            .filter(function (link) {
                if (!query) {
                    return true;
                }
                return link.split("/").pop().toLowerCase().indexOf(query) > -1;
            })
            .forEach(function (link) {
                var name = link.split("/").pop();

                if (query) {
                    name = name.replace(queryRegex, "<strong>$&</strong>");
                }

                html += `<li>
                     <a href="${link}">${name}</a> |
                     <a href="${link}" class="js-open-tail-window text-bold">tail</a>
                   </li>`;
            });

        $list.html(html);
    }

    function openOptionsPage() {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            chrome.tabs.create({
                url: chrome.runtime.getURL("options.html"),
            });
        }
    }

    function openTailLogWindow(logPath) {
        var w = 1200;
        var h = 800;
        var left = screen.width / 2 - w / 2;
        var top = screen.height / 2 - h / 2;
        var url = new URL(chrome.runtime.getURL("logTail/logTail.html"));
        url.searchParams.append("logPath", logPath);

        chrome.windows.create({
            url: url.toString(),
            type: "popup",
            width: w,
            height: h,
            left: left,
            top: top,
        });
    }

    function renderExtensionVersion() {
        var manifestData = chrome.runtime.getManifest();

        $(".js-version").html(manifestData.version);
    }
})();
