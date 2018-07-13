"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var StatusCode;
(function (StatusCode) {
    StatusCode[StatusCode["RESOLVE"] = 0] = "RESOLVE";
    StatusCode[StatusCode["REJECT"] = 1] = "REJECT";
    StatusCode[StatusCode["TIMEOUT"] = -1] = "TIMEOUT";
})(StatusCode = exports.StatusCode || (exports.StatusCode = {}));
function SerialPromise(promises, timeouts, wait, onProgress) {
    if (timeouts === void 0) { timeouts = []; }
    if (wait === void 0) { wait = 0; }
    if (onProgress === void 0) { onProgress = function () { return void 0; }; }
    return new Promise(function (resolve) {
        var totalCount = promises.length;
        var resolveQueue = [];
        var rejectQueue = [];
        var timeoutQueue = [];
        var rets = [];
        rets[-1] = null;
        var waitTimes = Array.isArray(wait) ? wait : [0].concat(Array(promises.length - 1).fill(wait));
        function worker(i) {
            var stop = false;
            var timer;
            var ret;
            if (timeouts[i]) {
                var timeoutHandler_1;
                var end_1 = false;
                ret = [
                    new Promise(function (resolve) {
                        timeoutHandler_1 = setTimeout(function () {
                            if (!end_1) {
                                end_1 = true;
                                timeoutQueue.push(i);
                                onProgress({
                                    total: totalCount,
                                    resolve: resolveQueue.slice(0),
                                    reject: rejectQueue.slice(0),
                                    timeout: timeoutQueue.slice(0),
                                });
                                resolve({ status: StatusCode.TIMEOUT, timeout: timeouts[i] });
                            }
                        }, timeouts[i]);
                    }),
                    new Promise(function (resolve) {
                        promises[i](rets[i - 1]).then(function (d) {
                            if (!end_1) {
                                end_1 = true;
                                clearTimeout(timeoutHandler_1);
                                resolveQueue.push(i);
                                onProgress({
                                    total: totalCount,
                                    resolve: resolveQueue.slice(0),
                                    reject: rejectQueue.slice(0),
                                    timeout: timeoutQueue.slice(0),
                                });
                                resolve({ status: StatusCode.RESOLVE, data: d });
                            }
                        }).catch(function (d) {
                            if (!end_1) {
                                end_1 = true;
                                clearTimeout(timeoutHandler_1);
                                rejectQueue.push(i);
                                onProgress({
                                    total: totalCount,
                                    resolve: resolveQueue.slice(0),
                                    reject: rejectQueue.slice(0),
                                    timeout: timeoutQueue.slice(0),
                                });
                                resolve({ status: StatusCode.REJECT, error: d });
                            }
                        });
                    }),
                ];
            }
            else {
                ret = [
                    new Promise(function (resolve) {
                        promises[i](rets[i - 1]).then(function (d) {
                            resolveQueue.push(i);
                            onProgress({
                                total: totalCount,
                                resolve: resolveQueue.slice(0),
                                reject: rejectQueue.slice(0),
                                timeout: timeoutQueue.slice(0),
                            });
                            resolve({ status: StatusCode.RESOLVE, data: d });
                        }).catch(function (d) {
                            rejectQueue.push(i);
                            onProgress({
                                total: totalCount,
                                resolve: resolveQueue.slice(0),
                                reject: rejectQueue.slice(0),
                                timeout: timeoutQueue.slice(0),
                            });
                            resolve({ status: StatusCode.REJECT, error: d });
                        });
                    })
                ];
            }
            Promise.race(ret).then(function (result) {
                rets.push(result);
                if (stop || promises.length === i + 1) {
                    clearTimeout(timer);
                    delete rets[-1];
                    resolve(rets);
                }
                else {
                    timer = setTimeout(function () {
                        clearTimeout(timer);
                        timer = null;
                        worker(i + 1);
                    }, waitTimes[i] || 0);
                }
            });
        }
        worker(0);
    });
}
exports.default = SerialPromise;
//# sourceMappingURL=index.js.map