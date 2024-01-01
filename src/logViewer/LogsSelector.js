(function () {
    /* global Choices */

    class LogsSelector {
        constructor(baseUrl, initialLogFile = "") {
            this.baseUrl = baseUrl;
            this.initialLogFile = initialLogFile;

            this.select = new Choices(".js-all-log-files", {
                removeItemButton: true,
                searchResultLimit: 999999,
                allowHTML: true,
                shouldSort: false,
                duplicateItemsAllowed: false,
                fuseOptions: {
                    includeScore: true,
                },
            });

            this.handleLogPanelClosed = this.handleLogPanelClosed.bind(this);
            $("body").on("logPanelClosed", this.handleLogPanelClosed);
        }

        destroy() {
            $("body").off("logPanelClosed", this.handleLogPanelClosed);
        }

        handleLogPanelClosed(_event, data) {
            this.select.removeActiveItemsByValue(data.id);
        }

        async loadSelectOptions() {
            await this.select.setChoices(
                async () => {
                    var groups = {};

                    const jobsListingResponse = await fetch(
                        this.baseUrl + "/on/demandware.servlet/webdav/Sites/Logs/jobs"
                    );
                    const jobsListing = await jobsListingResponse.text();

                    groups["jobs"] = [];
                    $(jobsListing)
                        .find('a[href*="jobs"]')
                        .each(function () {
                            const jobName = this.href.split("/").pop();
                            const modifiedTime = $(this)
                                .closest("tr")
                                .find("td[align=right] tt")
                                .last()
                                .text();
                            groups["jobs"].push({
                                label: `Job: ${jobName} - <time class="js-time-ago" data-time="${modifiedTime}" data-step="second"></time>`,
                                value: `${jobName}`,
                                customProperties: {
                                    modifiedTime: new Date(modifiedTime),
                                    type: "job",
                                },
                            });
                        });

                    const logListingResponse = await fetch(
                        this.baseUrl + "/on/demandware.servlet/webdav/Sites/Logs"
                    );
                    const logsListing = await logListingResponse.text();

                    $(logsListing)
                        .find('a[href$=".log"]')
                        .each(function () {
                            const logFileName = this.href.split("/").pop();
                            const fileSize = $(this)
                                .closest("tr")
                                .find("td[align=right] tt")
                                .first()
                                .text();
                            const modifiedTime = $(this)
                                .closest("tr")
                                .find("td[align=right] tt")
                                .last()
                                .text();
                            const groupMatch = logFileName.match(/(\d{4})(\d{2})(\d{2})\.log$/);
                            let groupId = "other";
                            if (groupMatch) {
                                groupId = `${groupMatch[1]} ${groupMatch[2]}  ${groupMatch[3]}`;
                            }

                            groups[groupId] = groups[groupId] || [];

                            groups[groupId].push({
                                label: `${logFileName} - ${fileSize} - <time class="js-time-ago" data-time="${modifiedTime}" data-step="second"></time>`,
                                value: logFileName,
                                customProperties: {
                                    modifiedTime: new Date(modifiedTime),
                                    type: "logFile",
                                },
                            });
                        });

                    return Object.keys(groups)
                        .toSorted(sortDateGroupsFirst)
                        .map((groupId) => {
                            return {
                                label: groupId,
                                choices: groups[groupId].toSorted(sortLogDate),
                            };
                        });
                },
                "value",
                "label",
                true
            );

            if (this.initialLogFile) {
                this.select.setChoiceByValue(this.initialLogFile);
                this.initialLogFile = "";
            }
        }

        onAdd(callback) {
            this.select.passedElement.element.addEventListener("addItem", callback);
        }

        onRemove(callback) {
            this.select.passedElement.element.addEventListener("removeItem", callback);
        }

        hideDropdown() {
            this.select.hideDropdown();
        }
    }

    function sortDateGroupsFirst(a, b) {
        const aHasLetters = a.match(/[a-z]/);
        const bHasLetters = b.match(/[a-z]/);

        if (aHasLetters && bHasLetters) {
            return a.localeCompare(b);
        }

        if (aHasLetters) {
            return 1;
        }

        if (bHasLetters) {
            return -1;
        }

        return b.localeCompare(a);
    }

    function sortLogDate(a, b) {
        return b.customProperties.modifiedTime - a.customProperties.modifiedTime;
    }

    window.LogsSelector = LogsSelector;
})();
