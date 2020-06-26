// ==UserScript==
// @name        调用 Aria2 下载比特球云盘文件
// @namespace   Bitqiu Export downloads to Aria2 RPC
// @version     0.2
// @author      Krazys
// @description 调用 Aria2 下载比特球云盘文件。苦于无人开发，故自己瞎几把写了个自用。
// @license     GPL-3.0 License
// @downloadURL https://github.com/Krazysdaki/bitqiu2aria2/raw/master/bitqiu.user.js
// @updateURL   https://github.com/Krazysdaki/bitqiu2aria2/raw/master/bitqiu.user.js
// @match       https://pan.bitqiu.com/*
// @require     https://cdn.bootcss.com/jquery/1.12.4/jquery.min.js
// @grant       GM_xmlhttpRequest
// @connect     localhost
// @connect     127.0.0.1
// @connect     10.1.1.8
// @connect     my.ariang.net
// ==/UserScript==

//###### 请在上方加入一行 "// @connect 【你的 Aria2 RPC 地址】"，已有例子，请照着写。本地运行忽略此条。######

(function() {
    'use strict';
    var RPC_URL = "http://127.0.0.1:6800/jsonrpc"; // 改成 Aria2 RPC 的地址，一般只需修改 IP/域名 部分
    var RPC_TOKEN = "123456789"; // 改成 Aria2 RPC 的密钥
    var PARAMS = "?method=aria2.addUri&id=foo&params="; // 一般无需修改

    var $ = window.$;

    setTimeout(function(){
        go();
    }, 2000)

    $(window).bind('hashchange', function() {
        setTimeout(function(){ go(); }, 1000);
    })

    function go(){
        for (let n = 0; n < $(".span-three-visible").length; n++) {
            if ($(".span-three-visible").eq(n).prev().find(".js-enter-dir").length > 0){
                continue;
            }
            else {
                var Aria2Icon = document.createElement("i");
                Aria2Icon.className = "icon icon-download";
                var Aria2Text = document.createElement("span");
                Aria2Text.innerText = "Aria2";
                var Aria2Btn = document.createElement("a");
                Aria2Btn.className = "text-link aria2-btn";
                Aria2Btn.title = "导出到 Aria2 PRC 下载";
                Aria2Btn.append(Aria2Icon, Aria2Text);
                $(".span-three-visible").eq(n).prepend(Aria2Btn);
            }
        }

        $(".aria2-btn").click(function() {
            var fid = $(this).parent().prev().find(".name-thumb").attr("data-id");
            $.ajax({
                type: "POST",
                url: "https://pan.bitqiu.com/download/getUrl",
                dataType: "text",
                data: "fileIds=" + fid + "&org_channel=default%7Cdefault%7Cdefault",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
                },
                error: function(data){
                    alert("获取下载地址出错，请尝试刷新页面或重新登陆。无法正常使用时请勿辱骂作者。");
                },
                success: function(data){
                    var jsondata = JSON.parse(data);
                    var url = jsondata.data.url;
                    var ua = navigator.userAgent;
                    callAria2(url, ua);
                },
                failure: function(data){
                    alert("获取下载地址出错，请尝试刷新页面或重新登陆。无法正常使用时请勿辱骂作者。");
                }
            })
        })

        function callAria2(url, ua){
            var data = "[\"token:" + RPC_TOKEN + "\", [\"" + url + "\"], {\"header\":[\"User-Agent: " + ua + "\"]}]";
            GM_xmlhttpRequest({
                url: RPC_URL + PARAMS + btoa(data),
                method: 'GET',
                onerror:function(response){
                    console.log(response);
                        alert("调用失败，请检查你的相关配置，尝试刷新页面或重新登陆等，无法正常使用时请勿辱骂作者。");
                },
                onload:function(response){
                    console.log(response);
                    if (response.status == "200"){
                        alert("调用 Aria2 下载成功！");
                    }
                }
            });
        }
    }
})();