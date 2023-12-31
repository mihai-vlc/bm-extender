(function () {
    let utf8decoder = new TextDecoder();

    class LogPanel {
        static PANEL_TEMPLATE = /*html*/ `<div class="log-panel">
            <div class="log-panel-title">
                <div class="log-panel-title-info">
                    <a href="" target="_blank" class="js-log-panel-title"></a>
                    <span class="loader"></span>
                </div>
                <div class="log-panel-actions">
                    <label class="log-panel-watch log-panel-cta" title="update the content when the log file size changes">
                        <input type="checkbox" class="js-log-panel-watch" />
                        Watch Changes
                    </label>
                    <button class="js-log-panel-refresh log-panel-cta" title="refresh panel content">
                        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11A8.1 8.1 0 0 0 4.5 9M4 5v4h4"></path><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"></path></g></svg>
                    </button>
                    <button class="js-log-panel-close log-panel-cta" title="close panel">
                        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512"><path d="M289.94 256l95-95A24 24 0 0 0 351 127l-95 95l-95-95a24 24 0 0 0-34 34l95 95l-95 95a24 24 0 1 0 34 34l95-95l95 95a24 24 0 0 0 34-34z" fill="currentColor"></path></svg>
                    </button>
                </div>
            </div>
            <div class="js-log-panel-content log-panel-content"></div>
            <div class="js-dragbar dragbar" title="resize panel"></div>
            <div class="log-panel-status-bar">
                <button class="js-log-panel-scroll-to" data-location="top" title="Scroll to top">Top</button>
                <button class="js-log-panel-scroll-to" data-location="previous" title="Scroll to previous log message">Previous</button>
                <button class="js-log-panel-scroll-to" data-location="active" title="Scroll to active log message">Active</button>
                <button class="js-log-panel-scroll-to" data-location="next" title="Scroll to next log message">Next</button>
                <button class="js-log-panel-scroll-to" data-location="bottom" title="Scroll to bottom">Bottom</button>
            </div>
        </div>`;

        constructor(logId, logType, baseUrl) {
            /*global LogLexer, DragBar */
            this.logId = logId;
            this.logType = logType;
            this.baseUrl = baseUrl;
            this.logLexer = new LogLexer();

            this.$panel = $(LogPanel.PANEL_TEMPLATE);
            $(".js-panels-wrapper").append(this.$panel);

            this.dragbar = new DragBar(this.$panel.find(".js-dragbar")[0]);

            this.$panel.on("click", ".js-log-panel-refresh", this.loadContent.bind(this));
            this.$panel.on("click", ".js-log-panel-close", this.handleClose.bind(this));
            this.$panel.on("click", ".js-log-panel-watch", this.handleWatchChange.bind(this));
            this.$panel.on("click", ".js-log-panel-scroll-to", this.handleScrollToPoint.bind(this));
            this.$panel.on("click", ".timestamp", this.handleTimestampClick.bind(this));
        }

        handleClose() {
            this.$panel.trigger("logPanelClosed", {
                id: this.logId,
            });
        }

        handleWatchChange(event) {
            /*global RemoteFileWatcher*/
            if (!this.lastLogUrl) {
                window.toast.error("No log file found for this panel.");
                return;
            }

            if (this.fileWatcher && !event.target.checked) {
                this.fileWatcher.stop();
                this.fileWatcher = null;
                window.toast.info(`stopped watching ${this.logId}`);
                this.$panel.removeClass("watching");
                return;
            }

            this.fileWatcher = new RemoteFileWatcher(this.lastLogUrl, this.lastKnownLogSize);
            this.fileWatcher.addListenerNewContent((data) => {
                this.processContentChunk({
                    done: true,
                    value: "<hr/>" + data,
                });
            });
            this.fileWatcher.start();
            window.toast.info(`started watching ${this.logId}`);
            this.$panel.addClass("watching");
        }

        handleScrollToPoint(event) {
            const location = $(event.target).attr("data-location");
            const $panelContent = this.$panel.find(".js-log-panel-content");
            const contentElement = $panelContent[0];
            switch (location) {
                case "top": {
                    contentElement.scroll({
                        top: 0,
                        behavior: "smooth",
                    });
                    this.setActiveLogMessage($panelContent.find(".timestamp").first());
                    break;
                }

                case "bottom": {
                    contentElement.scroll({
                        top: contentElement.scrollHeight,
                        behavior: "smooth",
                    });
                    this.setActiveLogMessage($panelContent.find(".timestamp").last());
                    break;
                }
                case "previous": {
                    const logMarker = findPreviousWithClass(this.$activeLogMessage[0], "timestamp");
                    if (logMarker != null) {
                        this.setActiveLogMessage($(logMarker));
                        this.$activeLogMessage[0].scrollIntoView({
                            behavior: "smooth",
                        });
                    } else {
                        window.toast.info("First log message reached");
                    }
                    break;
                }
                case "next": {
                    const logMarker = findNextWithClass(this.$activeLogMessage[0], "timestamp");
                    if (logMarker != null) {
                        this.setActiveLogMessage($(logMarker));
                        this.$activeLogMessage[0].scrollIntoView({
                            behavior: "smooth",
                        });
                    } else {
                        window.toast.info("Last log message reached");
                    }
                    break;
                }

                case "active": {
                    this.$activeLogMessage[0].scrollIntoView({
                        behavior: "smooth",
                    });
                    break;
                }

                default: {
                    window.toast.error("Invalid location");
                    break;
                }
            }
        }

        handleTimestampClick(event) {
            console.log(event.target);
            this.setActiveLogMessage($(event.target));
        }

        setActiveLogMessage($element) {
            this.$panel.find(".timestamp").removeClass("active");
            this.$activeLogMessage = $element;
            this.$activeLogMessage.addClass("active");
        }

        loadContent() {
            this.$panel.find(".js-log-panel-content").empty();

            if (this.logType == "job") {
                this.processJobLogs(this.logId);
            } else {
                this.loadLogFile(this.logId);
            }
        }

        loadLogFile(logPath) {
            const logUrl = `${this.baseUrl}/on/demandware.servlet/webdav/Sites/Logs/${logPath}`;
            this.lastLogUrl = logUrl;

            this.$panel
                .find(".js-log-panel-title")
                .attr("href", logUrl)
                .html(logPath.split("/").pop());

            this.readDataInChunks(logUrl, this.processContentChunk.bind(this));
        }

        processContentChunk({ _done, value }) {
            const $content = this.$panel.find(".js-log-panel-content");
            $content.append(this.highlightKeywords(value));
            $content.scrollTop($content[0].scrollHeight);
            this.setActiveLogMessage($content.find(".timestamp").last());

            // if (value) {
            //     this.logLexer.appendChunk(value);
            // }

            // if (done) {
            //     this.logLexer.processCurrentMessage();
            //     console.log("done");
            // }
        }

        highlightKeywords(text) {
            if (!text) {
                return text;
            }
            text = escapeHtml(text);

            const currentDate = new Date();
            currentDate.setMinutes(currentDate.getMinutes() + currentDate.getTimezoneOffset());

            const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
            const day = currentDate.getDate().toString().padStart(2, "0");
            const hour = currentDate.getHours().toString().padStart(2, "0");
            const minute = currentDate.getMinutes().toString().padStart(2, "0")[0];
            const recentDate = `${currentDate.getFullYear()}-${month}-${day} ${hour}:${minute}`;

            text = text.replace(/(\[(\d{4}-.*?)\])/gm, function (_match, p1, p2) {
                let prefix = "";
                if (p2.startsWith(recentDate)) {
                    prefix = `(<time class="js-time-ago" data-time="${p2}" data-step="second">${p2}</time>) `;
                }

                return `<button class="token timestamp" title="click to set as active">${prefix}${p1}</button>`;
            });
            text = text.replace(
                /(WARN|warning|DEBUG|INFO)/g,
                '<b class="token important italic">$1</b>'
            );
            text = text.replace(/(ERROR)/g, '<b class="token danger italic">$1</b>');
            text = text.replace(/(importPackage|require)/g, '<b class="token selector">$1</b>');
            text = text.replace(/(Sites-([\w-]+)?Site)/g, '<b class="token keyword italic">$1</b>');
            text = text.replace(
                /(null|TypeError|ReferenceError|SystemError)/gi,
                '<b class="token danger">$1</b>'
            );

            text = text.replace(
                /(TEMPLATE:)([^ :]+)/gi,
                '<b class="token">$1</b><b class="token keyword">$2</b>'
            );

            text = text.replace(
                /(Job \[\w ]+\])/gi,
                '<b class="token">$1</b><b class="token keyword">$2</b>'
            );

            text = text.replace(/\|(\w+-\w+)\|/g, '|<b class="token function">$1</b>|');
            text = text.replace(/\/(\w+-\w+)\b/g, '/<b class="token function">$1</b>');

            text = text.replace(
                /(#|lineNumber: |line |js:)(\d+)/gi,
                '$1<b class="token number">$2</b>'
            );

            text = text.replace(/([a-z]\w+\s*)\(/gi, '<b class="token function">$1</b>(');
            text = text.replace(/(\/\w+\.(js|ds|isml)\b)/gi, '<b class="token keyword">$1</b>');

            text = text.replace(/(\/\w+\.(js|ds|isml)\b)/gi, '<b class="token keyword">$1</b>');

            text = text.replace(/(^\tat.+$)/gim, '<small class="token small">$1</small>');

            return text;
        }

        async readDataInChunks(url, onChunk) {
            const response = await fetch(url, {
                headers: {
                    Range: "bytes=0-",
                },
            });
            const reader = response.body.getReader();
            for (;;) {
                const chunk = await reader.read();

                onChunk({
                    value: chunk.value && utf8decoder.decode(chunk.value),
                    done: chunk.done,
                });

                if (chunk.done) {
                    break;
                }
            }

            const contentRange = response.headers.get("content-range") || "0-0/0";
            this.lastKnownLogSize = parseInt(contentRange.split("/")[1], 10) || 0;
        }

        async processJobLogs(jobId) {
            try {
                const response = await fetch(
                    `${this.baseUrl}/on/demandware.servlet/webdav/Sites/Logs/jobs/${jobId}`
                );
                const data = await response.text();
                const $logLinks = $(data).find('a[href$=".log"]');

                if ($logLinks.length == 0) {
                    window.toast.error(`No logs were found for ${jobId}`);
                    return;
                }

                const recentLogs = $logLinks
                    .map((_, el) => {
                        const logFileName = el.href.split("/").pop();
                        const modifiedTime = $(el)
                            .closest("tr")
                            .find("td[align=right] tt")
                            .last()
                            .text();

                        return {
                            logFileName: `${jobId}/${logFileName}`,
                            modifiedTime: new Date(modifiedTime),
                        };
                    })
                    .get()
                    .toSorted((a, b) => b.modifiedTime - a.modifiedTime)
                    .slice(0, 1);

                recentLogs.forEach((log) => {
                    this.loadLogFile(`jobs/${log.logFileName}`);
                });
            } catch (e) {
                console.error(e);
                window.toast.error(`Failed to load the data for ${jobId}, ${e}`);
            }
        }

        destroy() {
            if (this.fileWatcher) {
                this.fileWatcher.destroy();
            }

            if (this.dragbar) {
                this.dragbar.destroy();
            }

            this.$panel.remove();
        }
    }

    function findPreviousWithClass(element, className) {
        while (element) {
            element = element.previousElementSibling;
            if (element && element.classList.contains(className)) {
                return element;
            }
        }
        return null;
    }

    function findNextWithClass(element, className) {
        while (element) {
            element = element.nextElementSibling;
            if (element && element.classList.contains(className)) {
                return element;
            }
        }
        return null;
    }

    var entityMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
        "/": "&#x2F;",
        "`": "&#x60;",
        "=": "&#x3D;",
    };

    function escapeHtml(string) {
        return String(string).replace(/[&<>"'`=\/]/g, function (s) {
            return entityMap[s];
        });
    }

    window.LogPanel = LogPanel;
})();
