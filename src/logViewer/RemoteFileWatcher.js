(function () {

    class RemoteFileWatcher {

        constructor(url, lastKnownFileSize = 0) {
            this.url = url;
            this.fileSize = lastKnownFileSize;
            this.intervalId = 0;

            this.listeners = [];
        }

        start() {
            this.intervalId = setInterval(async () => {
                const newSize = await this.getFileSize();

                if (newSize > this.fileSize) {
                    const content = await this.getFileContent(`${this.fileSize}-${newSize - 1}`);
                    this.fileSize = newSize;

                    this.listeners.forEach(callback => callback(content));
                }

            }, 2500);
        }

        stop() {
            if (this.intervalId) {
                clearInterval(this.intervalId);
            }
        }

        async addListenerNewContent(callback) {
            this.listeners.push(callback);
        }

        async removeListenerNewContent(callback) {
            this.listeners = this.listeners.filter(l => l == callback);
        }

        async getFileSize() {
            try {
                const response = await fetch(this.url, {
                    method: "HEAD",
                    headers: {
                        Range: "bytes=0-"
                    }
                });

                if (!response.ok) {
                    console.error(await response.text());
                    return 0;
                }

                // SFCC doesn't send Content-Length for large files !?
                let contentRange = response.headers.get("content-range") || "0-0/0";
                return parseInt(contentRange.split("/")[1], 10);
            } catch (e) {
                console.error(e);
            }
            return 0;
        }

        async getFileContent(range = "") {
            try {
                const headers = {};

                if (range) {
                    headers.Range = `bytes=${range}`;
                }

                const response = await fetch(this.url, {
                    headers: headers
                });

                if (!response.ok) {
                    console.error(await response.text());
                    return 0;
                }

                return await response.text();
            } catch (e) {
                console.error(e);
            }
            return 0;
        }


    }

    window.RemoteFileWatcher = RemoteFileWatcher;

})();

