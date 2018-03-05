(function () {

    chrome.storage.sync.get(["ChannelAdvanced", "username", "id"], items => {

        if (!items.username) chrome.runtime.openOptionsPage(() => {});

        if (items.ChannelAdvanced && items.ChannelAdvanced.length > 0) {
            document.querySelector("#blender").innerHTML =
                Handlebars.templates.popup(items);

            let anchors = document.querySelectorAll("a");

            anchors.forEach(anchor => {
                anchor.addEventListener("click", event => {
                    chrome.tabs.create({
                        "url": anchor.href
                    });
                });
            });
        }

    });

})();
