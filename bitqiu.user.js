// ==UserScript==
// @name        调用 Aria2 下载比特球云盘文件
// @namespace   Bitqiu Export downloads to Aria2 RPC
// @version     0.6
// @author      Knect,alex
// @description 调用 Aria2 下载比特球云盘文件。苦于无人开发，故自己瞎几把写了个自用。
// @license     GPL-3.0 License
// @downloadURL https://github.com/imKnect/bitqiu2aria2/raw/master/bitqiu.user.js
// @updateURL   https://github.com/imKnect/bitqiu2aria2/raw/master/bitqiu.user.js
// @match       https://pan.bitqiu.com/*
// @require     https://cdn.jsdelivr.net/npm/toastify-js
// @resource css https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css
// @grant       GM_xmlhttpRequest
// @grant       GM_addStyle
// @grant       GM_addElement
// @grant       GM_getResourceText
// @connect     localhost
// @connect     127.0.0.1
// @connect     10.1.1.5
// @connect     192.168.1.10
// ==/UserScript==

//###### 请在上方加入一行 "// @connect 【你的 Aria2 RPC 地址】"，已有例子，请照着写。本地运行忽略此条。######

(function () {
    'use strict';
    var RPC_URL = "http://127.0.0.1:6800/jsonrpc"; // 改成 Aria2 RPC 的地址，一般只需修改 IP/域名 部分
    var RPC_TOKEN = "123456789"; // 改成 Aria2 RPC 的密钥
    var PARAMS = "?method=aria2.addUri&id=foo&params="; // 一般无需修改
    var DOWNLOAD_URL = "/downloads";  // 下载路径,请提前修改

    GM_addElement('script', {
        src: 'https://cdn.jsdelivr.net/npm/toastify-js',
        type: 'text/javascript'
    })

    GM_addStyle(GM_getResourceText("css"))

    setTimeout(function () {
        go();
    }, 1000)

    var oldURL = document.URL;
    var newURL = document.URL;

    setInterval(function () {
        if (isUrlChanged()) {
            setTimeout(() => {
                go();
            }, 1000);
        }
    }, 50);

    function isUrlChanged() {
        newURL = document.URL;
        if (newURL != oldURL) {
            oldURL = newURL;
            return true;
        }
        return false;
    }

    function go() {

        var Aria2Btn = $('span:contains("下载")').last().parent().clone();
        Aria2Btn.addClass("aria2-btn");
        Aria2Btn.find('span')[0].innerText = "Aria2";

        var FileCount = $(".name-wrap").length;

        for (let n = 0; n < FileCount; n++) {
            var NewBtn = Aria2Btn.clone();
            $(".name-wrap").eq(n).parent().siblings().filter(".operation").prepend(NewBtn);
        }


        $(".aria2-btn").click(function () {

            var data_index = $(this).parent().parent().attr("data-index");
            var resource = App.$vue.$store.getters["filelist/fileList"][data_index]

            if (resource.dirType == 0) {
                traverse(resource.resourceId, 0, resource.name)
            } else {
                download(resource.resourceId, "")
            }

        })

        // traverse folder to download recursely
        function traverse(resourceId, level, path) {
            var resourceList = listFolder(resourceId)
            for (const resource of resourceList) {
                if (resource.dirType == 0) {
                    traverse(resource.resourceId, level++, path + "/" + resource.name)
                } else {
                    // if (["mov", "mp4", "m4a", "m4v", "mpg", "wmv", "avi", "flv"].includes(resource.name.split('.')[1])) {
                    download(resource.resourceId, path)
                    // }
                }
            }
        }

        // synchronous get folder list
        function listFolder(resourceId) {
            var res = [];
            $.ajax({
                async: false,
                type: "POST",
                url: "https://pan.bitqiu.com/apiToken/cfi/fs/resources/pages",
                dataType: "text",
                data: "parentId=" + resourceId + "&org_channel=default%7Cdefault%7Cdefault",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
                },
                error: function () {
                    //alert("获取下载地址出错，请尝试刷新页面或重新登陆。");
                    Toastify({
                        text: "获取目录出错，请尝试刷新页面或重新登陆。",
                        duration: 3000
                    }).showToast();
                },
                success: function (data) {
                    var jsondata = JSON.parse(data);
                    res = jsondata.data.data;
                },
                failure: function () {
                    //alert("获取下载地址出错，请尝试刷新页面或重新登陆。");
                    Toastify({
                        text: "获取目录出错，请尝试刷新页面或重新登陆。",
                        duration: 3000
                    }).showToast();
                }
            })
            return res;
        }

        function download(resourceId, path) {
            $.ajax({
                'async': false,
                type: "POST",
                tryCount: 0,
                retryLimit: 3,
                url: "https://pan.bitqiu.com/download/getUrl",
                dataType: "text",
                data: "fileIds=" + resourceId + "&org_channel=default%7Cdefault%7Cdefault",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
                },
                error: function (response, status, error) {
                    if (response.status == 423) {
                        this.tryCount++;
                        if (this.tryCount <= this.retryLimit) {
                            console.log('failure');
                            setTimeout(() => {
                                console.log('retrying');
                                $.ajax(this);
                            }, 500);
                            return;
                        } else {
                            //alert("获取下载地址出错，请尝试刷新页面或重新登陆。");
                            Toastify({
                                text: "获取下载地址出错，请尝试刷新页面或重新登陆。",
                                duration: 3000
                            }).showToast();
                        }
                    }

                },
                success: function (data) {
                    Toastify({
                        text: "获取链接成功！等待导出aria2",
                        duration: 3000
                    }).showToast();
                    var jsondata = JSON.parse(data);
                    if (jsondata.message == "success") {
                        var url = jsondata.data.url;
                        var ua = navigator.userAgent;
                        callAria2(url, ua, path);
                    } else {
                        Toastify({
                            text: resourceId + jsondata.message,
                            duration: 3000
                        }).showToast();
                    }

                },
                failure: function () {
                    //alert("获取下载地址出错，请尝试刷新页面或重新登陆。");
                    Toastify({
                        text: "获取下载地址出错，请尝试刷新页面或重新登陆。",
                        duration: 3000
                    }).showToast();
                }
            })
        }

        function callAria2(url, ua, path) {
            var data = [
                "token:" + RPC_TOKEN,
                [url],
                {
                    "user-agent": ua,
                    "dir": DOWNLOAD_URL + "/" + path
                }
            ];

            // call GM_xmlhttpRequest to bypass mixed content
            GM_xmlhttpRequest({
                // bota utf8 compatiable
                url: RPC_URL + PARAMS + btoa(unescape(encodeURIComponent(JSON.stringify(data)))),
                method: 'GET',
                onerror: function (response) {
                    console.log(response);
                    //alert("调用失败，请检查你的相关配置，尝试刷新页面或重新登陆。");
                    Toastify({
                        text: "调用失败，请检查你的相关配置，尝试刷新页面或重新登陆。",
                        duration: 3000
                    }).showToast();
                },
                onload: function (response) {
                    console.log(response);
                    if (response.status == "200") {
                        Toastify({
                            text: "调用 Aria2 下载成功！",
                            duration: 3000
                        }).showToast();
                    }
                }
            });
        }
    }
})();