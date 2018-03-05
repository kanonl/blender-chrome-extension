(function () {

    chrome.storage.sync.get(null, items => {
        console.log(items);
        if (items.username) document.querySelector("#user").value = items.username;
    });

    document.querySelector("#formOptions").addEventListener("submit", event => {
        event.preventDefault();

        const username = document.querySelector("#user").value.trim();

        if (username.length > 0) {

            fetch(`https://mixer.com/api/v1/users/search?query=${username}&limit=1&noCount=false&fields=id,username`).then(response => response.json()).then(json => {
                if (json.length > 0) {
                    chrome.storage.sync.clear(() => {
                        chrome.storage.sync.set({
                            "username": json[0].username,
                            "id": json[0].id
                        }, () => {
                            chrome.runtime.sendMessage({
                                "action": "resetAlarm"
                            });
                            showAlert("Mixer Username Saved");
                        });
                    });
                }
            });

        }
    });

    document.querySelector(".btn-reset").addEventListener("click", event => {
        chrome.storage.sync.clear(() => {
            chrome.browserAction.disable();
            chrome.browserAction.setTitle({
                "title": ""
            });
            chrome.browserAction.setBadgeText({
                "text": ""
            });
            showAlert("Data Reset");
        });
    });

    const showAlert = message => {
        const alert = document.querySelector(".alert");

        alert.innerHTML = message;
        alert.removeAttribute("hidden");

        setTimeout(function () {
            alert.setAttribute("hidden", null);
        }, 2500);
    };

})();
