(function () {

    "use strict";

    const blender = {
        "ALARMS": {
            "Name": "blender",
            "When": Date.now() + 1000,
            "PeriodInMinutes": 10
        },
        "NOTIFICATIONS": {
            "TYPE": {
                "List": "list",
                "Basic": "basic",
                "Image": "image"
            },
            "Title": "blender",
            "RequireInteraction": true
        },
        "BLENDER": {
            "Logo": chrome.runtime.getURL("assets/images/MixerMerge_Light.svg"),
            "Url": "https://mixer.com",
            "Endpoints": {
                "users": "/api/v1/users"
            }
        }
    };

    chrome.browserAction.setIcon({
        "path": blender.BLENDER.Logo
    });

    chrome.runtime.onInstalled.addListener(event => setAlarm(blender.ALARMS.Name, blender.ALARMS.When, blender.ALARMS.PeriodInMinutes));

    chrome.runtime.onStartup.addListener(event => setAlarm(blender.ALARMS.Name, blender.ALARMS.When, blender.ALARMS.PeriodInMinutes));

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "resetAlarm") {
            console.log("Resetting alarm");
            setAlarm(blender.ALARMS.Name, blender.ALARMS.When, blender.ALARMS.PeriodInMinutes);
        }
    });

    chrome.alarms.onAlarm.addListener(alarm => {
        if (alarm.name === blender.ALARMS.Name) {
            chrome.storage.sync.get(["username", "id"], items => {
                if (items.username) {
                    fetchChannels(items);
                } else {
                    chrome.runtime.openOptionsPage(() => {});
                }
            });
        }
    });

    chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
        if (buttonIndex === 0) {
            chrome.notifications.clear(notificationId, wasCleared => {
                let createProperties = {
                    "url": notificationId
                };
                chrome.tabs.create(createProperties, tab => {
                    console.log(tab);
                });
            });
        }
    });

    const setAlarm = (name, when, periodInMinutes) => {
        chrome.alarms.clear(name, wasCleared => {
            chrome.alarms.create(name, {
                when: when,
                periodInMinutes: periodInMinutes
            });
        });
    };

    const fetchChannels = mixer => {

        chrome.browserAction.setTitle({
            "title": mixer.username
        });

        const url = new URL(blender.BLENDER.Url);
        url.pathname = `${blender.BLENDER.Endpoints.users}/${mixer.id}/follows`;
        url.search = new URLSearchParams({
            "limit": 25,
            "where": "online:eq:true",
            "noCount": false,
            "fields": "id,name,user,type,viewersCurrent,numFollowers,audience,featured"
        });

        let ChannelAdvanced = [];
        let notificationCount = 0;

        fetch(url.toString()).then(response => response.json()).then(json => {
            json.forEach(element => {
                ChannelAdvanced.push({
                    "id": element.id,
                    "name": element.name,
                    "avatarUrl": element.user.avatarUrl,
                    "username": element.user.username,
                    "type": (element.type) ? element.type.name : "",
                    "viewersCurrent": element.viewersCurrent,
                    "numFollowers": element.numFollowers,
                    "audience": element.audience,
                    "featured": element.featured,
                    "url": `https://mixer.com/${element.user.username}`
                });

            });

            setBadge(ChannelAdvanced.length);

            chrome.storage.sync.get({
                "ChannelAdvanced": []
            }, items => {
                ChannelAdvanced.forEach(newchannel => {
                    let notify = true;

                    items.ChannelAdvanced.forEach(channel => {
                        if (channel.username === newchannel.username) {
                            notify = false;
                        }
                    });

                    if (notify && (notificationCount < 10)) {
                        createNotification(newchannel);
                        notificationCount++;
                    }
                });

                chrome.storage.sync.set({
                    "ChannelAdvanced": ChannelAdvanced
                });

            });
        });

    };

    const setBadge = streamCount => {
        if (streamCount > 0) {
            chrome.browserAction.enable();
        } else {
            chrome.browserAction.disable();
            chrome.browserAction.setTitle({
                "title": `${blender.NOTIFICATIONS.Title} - No active stream`
            });
        }

        chrome.browserAction.setBadgeText({
            "text": (streamCount > 0) ? streamCount.toString() : ""
        });
    };

    const createNotification = stream => {
        let d = new Date();

        let notificationOptions = {
            type: blender.NOTIFICATIONS.TYPE.Image,
            iconUrl: stream.avatarUrl,
            title: stream.username,
            message: stream.name,
            contextMessage: stream.type,
            eventTime: d.getTime(),
            imageUrl: `https://thumbs.mixer.com/channel/${stream.id}.small.jpg`,
            buttons: [
                {
                    "title": `${stream.viewersCurrent} viewers`,
                    "iconUrl": blender.BLENDER.Logo
                }
            ],
            requireInteraction: blender.NOTIFICATIONS.RequireInteraction
        };

        showNotification(notificationOptions, stream.url);

        return;
    };

    const showNotification = (notificationOptions, url) => {
        if (!url) url = null;
        chrome.notifications.create(url, notificationOptions, notificationId => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
            }
            console.log(`[notificationId] ${notificationId}`);
        });
    };

})();
