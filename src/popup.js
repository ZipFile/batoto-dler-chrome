const bg = chrome.extension.getBackgroundPage();
const title = document.getElementById("title");
const chapter = document.getElementById("chapter");
const group = document.getElementById("group");
const page = document.getElementById("page");
const pages = document.getElementById("pages");
const active_tab_query = {"active": true, "currentWindow": true};

const dl_full = document.getElementById("dl_full");
const dl_from_current = document.getElementById("dl_from_current");
const dl_stop = document.getElementById("dl_stop");

chrome.tabs.query(active_tab_query, function(tabs) {
    const info = bg.infos[tabs[0].id];

    title.textContent = info["title"];
    chapter.textContent = info["chapter"];
    group.textContent = info["group"];
    page.textContent = info["page"];
    pages.textContent = info["pages"];
});

dl_full.addEventListener("click", function() {
    chrome.tabs.query(active_tab_query, function(tabs) {
        bg.start(tabs[0].id);
        window.close();
    });
});

dl_from_current.addEventListener("click", function() {
    chrome.tabs.query(active_tab_query, function(tabs) {
        bg.start(tabs[0].id, true);
        window.close();
    });
});

dl_stop.addEventListener("click", function() {
    chrome.tabs.query(active_tab_query, function(tabs) {
        bg.stop(tabs[0].id);
        window.close();
    });
});
