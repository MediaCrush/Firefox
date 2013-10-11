var contextMenu = require("sdk/context-menu");
var tabs = require("sdk/tabs");
let { setTimeout } = require('sdk/timers');
var Request = require("sdk/request").Request;
var Panel = require("sdk/panel").Panel;
var data = require("sdk/self").data;
var menuItem = contextMenu.Item({
    label: "Rehost on MediaCrush",
    context: contextMenu.SelectorContext('img'),
    contentScript: "self.on('click', function(node, data) { self.postMessage(node.src); });",
    onMessage: function(image) {
        var panel = Panel({
            width: 300,
            height: 62,
            position: {
                bottom: 5,
                left: 5
            },
            contentURL: data.url("processing.html"),
            contentScriptFile: data.url("processing.js")
        });
        panel.port.on('close', function() {
            panel.hide();
        });
        panel.show();
        var request = Request({
            url: 'https://mediacru.sh/api/upload/url',
            content: {
                url: image
            },
            onComplete: function(response) {
                if (response.status == 409) {
                    panel.destroy();
                    tabs.open('https://mediacru.sh/' + response.json.hash);
                } else {
                    setTimeout(function() { checkStatus(response.json.hash, panel); }, 1000);
                }
            }
        });
        request.post();
    }
});
function checkStatus(hash, panel) {
    var request = Request({
        url: 'https://mediacru.sh/api/' + hash + '/status',
        onComplete: function(response) {
            if (response.json.status == 'error') {
                panel.port.emit('change', 'An error occured while processing.');
            } else if (response.json.status == 'timeout') {
                panel.port.emit('change', 'This file took too long to process.');
            } else if (response.json.status == 'done') {
                panel.destroy();
                tabs.open('https://mediacru.sh/' + hash + '#fromExtension');
            } else {
                setTimeout(function() { checkStatus(hash); }, 1000);
            }
        }
    });
    request.get();
}
