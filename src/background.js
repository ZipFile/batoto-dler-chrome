var infos = {};
var current_downloads = {};
var queues = {};
var dues = {};

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    const tab_id = sender.tab.id;

    infos[tab_id] = request;

    chrome.pageAction.show(tab_id);

    const due = dues[tab_id];

    if (due && (due === make_id_from_info(request))) {
        download(tab_id, request);
    }
});

chrome.tabs.onRemoved.addListener(function(id) {
    delete infos[id];
    delete queues[id];
    delete dues[id];
});

chrome.downloads.onChanged.addListener(function(downloadDelta) {
    const stateDelta = downloadDelta.state;

    if (!stateDelta) {
        return;
    }

    const state = stateDelta.current;

    if (state === "in_progress") {
        return;
    }

    const tab_id = current_downloads[downloadDelta.id];

    if (!tab_id) {
        return;
    } else if (state === "interrupted") {
        stop(tab_id);
    } else {
        next(tab_id);
    }
});

var active_tab_query = {"active": true, "currentWindow": true};

chrome.commands.onCommand.addListener(function(command) {
    if (command === "full") {
        chrome.tabs.query(active_tab_query, function(tabs) {
            start(tabs[0].id);
        });
    } else if (command === "from_current") {
        chrome.tabs.query(active_tab_query, function(tabs) {
            start(tabs[0].id, true);
        });
    } else if (command === "stop") {
        chrome.tabs.query(active_tab_query, function(tabs) {
            stop(tabs[0].id);
        });
    }
});

function next(tab_id) {
    const queue = queues[tab_id];
    const info = infos[tab_id];

    if (!(info && queue && queue.length)) {
        stop(tab_id);

        return;
    }

    const [id, url] = queue.pop();
    dues[tab_id] = id;

    if (id === make_id_from_info(info)) {
        setTimeout(function() {
            chrome.tabs.reload(tab_id);
        }, 1000);
    } else {
        setTimeout(function() {
            chrome.tabs.update(tab_id, {url});
        }, 1000);
    }
}

function stop(tab_id) {
    delete queues[tab_id];
    delete dues[tab_id];

    exit_crawl_mode();
    chrome.tabs.reload(tab_id);
}

function start(tab_id, resume) {
    const info = infos[tab_id];

    if (!info) {
        return;
    }

    const map = info.page_to_url_map;
    const queue = [];
    const starting_page = resume ? info.page : 1;

    for (let page = info.pages; page >= starting_page; page--) {
        const url = map[page];

        if (url) {
            queue.push([make_id_from_info(info, page), url]);
        }
    }

    if (queue.length) {
        enter_crawl_mode();
        queues[tab_id] = queue;
        next(tab_id);
    }
}

function download(tab_id, info) {
    chrome.downloads.download({
        "url": info.url,
        "filename": make_dl_path_from_info(info),
        "saveAs": false,
        "conflictAction": "prompt",
    }, function(downloadId) {
        current_downloads[downloadId] = tab_id;
    });
}

function normalize_name(name) {
    return name.trim().replace(/\s+/g, " ").replace(/[\u0000-\u0019\\\/<?>\:*|"]+/g, "").normalize();
}

function get_file_ext(name) {
    const tmp = name.split(".");

    return tmp[tmp.length - 1];
}

function make_id_from_info(info, page) {
    return [
        info.title,
        info.group,
        info.chapter,
        (page ? page : info.page).toString(),
    ].join(' ').replace(/\s+/g, "_").toUpperCase();
}

function make_dl_path_from_info(info) {
    const lead_zeros = info.pages.toString().length;
    const page_number = info.page.toString().padStart(lead_zeros, "0");
    const ext = get_file_ext((new URL(info.url)).pathname);

    return [
        "Batoto",
        normalize_name(info.title),
        normalize_name(info.group),
        normalize_name(info.chapter),
        `${page_number}.${ext}`,
    ].join("/");
}

var content_types = [
    "images",
    "plugins",
    "notifications",
    "microphone",
    "camera",
    "unsandboxedPlugins",
];

function enter_crawl_mode() {
    for (const type of content_types) {
        chrome.contentSettings[type].set({
            "primaryPattern": "*://bato.to/*",
            "setting": "block",
        });
    }
}

function exit_crawl_mode() {
    for (const type of content_types) {
        chrome.contentSettings[type].clear({});
    }
}
