(function () {
    class LogLexer {
        static logLinePrefix = /^\[\d{4}-\d{2}-\d{2} \d{2}/;
        static separators = ["|", "[", "]", ",", ".", "!", " "];
        static identifierRegex = /[^ |[\],.!]/;
        static logLevels = ["TRACE", "DEBUG", "INFO", "WARN", "ERROR", "FATAL"];
        static pageRegex = /^[a-zA-Z0-9_]+(-[a-zA-Z0-9_]+)+$/;

        constructor() {
            this.message = '';
            this.allTokens = [];
        }

        appendChunk(chunk) {
            for (let i = 0; i < chunk.length; i++) {
                const c = chunk[i];

                if (c == "\n" && chunk.substring(i + 1, i + 15).match(LogLexer.logLinePrefix)) {
                    this.processCurrentMessage();
                } else {
                    this.message += c;
                }
            }
        }

        processCurrentMessage() {
            this.currentIndex = 0;
            this.messageLength = this.message.length;
            this.allTokens = [];

            const tokens = this.generateAllTokens();

            setTimeout(() => {
                const $content = $('.js-log-panel-content');
                $content.append(`<div>${tokens[0].value} - ${tokens[1].value}</div>`);
                $content.scrollTop($content[0].scrollHeight);
            }, 16);

            this.message = "";
        }

        generateAllTokens() {
            let token = this.nextToken();

            while (token) {
                this.allTokens.push(token);

                token = this.nextToken();
            }

            return this.allTokens;
        }
        nextToken() {
            this.skipSeparators();

            if (this.isEOL()) {
                return null;
            }

            if (this.isDateStart()) {
                return this.date();
            }

            if (this.isWordStart()) {
                return this.word();
            }

            throw new Error(
                `Unexpected token on line ${this.message} at index ${this.currentIndex}`
            );
        }

        isEOL() {
            return this.currentIndex >= this.messageLength;
        }

        isDateStart() {
            let val = this.message.substring(this.currentIndex, 5);

            return val == `${LogLexer.currentYear}-`;
        }

        date() {
            let value = this.consumeUntil("]");

            return {
                kind: "date",
                value: value,
            };
        }

        isWordStart() {
            return this.peek().match(LogLexer.identifierRegex);
        }
        word() {
            let value = "";

            let currentChar = this.peek();
            while (currentChar && currentChar.match(LogLexer.identifierRegex)) {
                value += this.next();
                currentChar = this.peek();
            }

            if (LogLexer.logLevels.indexOf(value) > -1) {
                return {
                    kind: "logLevel",
                    value: value,
                };
            }

            if (value.startsWith("Sites-")) {
                return {
                    kind: "siteId",
                    value: value,
                };
            }

            if (value.match(LogLexer.pageRegex) || value == "--Start") {
                return {
                    kind: "pageName",
                    value: value,
                };
            }

            if (value == "-" || value.startsWith("custom")) {
                return {
                    kind: "messageSeparator",
                    value: value,
                };
            }

            return {
                kind: "identifier",
                value: value,
            };
        }

        consumeUntil(finalChar) {
            let value = "";

            let currentChar = this.next();

            while (!this.isEOL() && currentChar != finalChar) {
                value += currentChar;
                currentChar = this.next();
            }

            return value;
        }

        skipSpaces() {
            while (!this.isEOL() && this.peek().match(/\s/)) {
                this.next();
            }
        }

        skipSeparators() {
            while (!this.isEOL() && LogLexer.separators.indexOf(this.peek()) > -1) {
                this.next();
            }
        }

        next() {
            let c = this.message[this.currentIndex];
            this.currentIndex++;
            return c;
        }

        peek() {
            return this.message[this.currentIndex];
        }
    }

    window.LogLexer = LogLexer;
})();
