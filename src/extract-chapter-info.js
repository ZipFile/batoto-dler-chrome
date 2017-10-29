function collect_info() {
    const title_link = document.querySelector("#reader .moderation_bar li:first-child a");
    const chapter_selector = document.getElementsByName("chapter_select")[0];
    const group_selector = document.getElementsByName("group_select")[0];
    const page_selector = document.getElementsByName("page_select")[0];
    const comic_page = document.getElementById("comic_page");

    const page_to_url_map = {};

    for (const option of page_selector.options) {
        page_to_url_map[option.index + 1] = option.value;
    }

    return {
        "page_to_url_map": page_to_url_map,
        "title": title_link.text,
        "chapter": chapter_selector.options[chapter_selector.selectedIndex].text,
        "group": group_selector.options[group_selector.selectedIndex].text,
        "page": page_selector.selectedIndex + 1,
        "pages": page_selector.options.length,
        "url": comic_page.src,
    };
}


const observer = new MutationObserver(function(mutations) {
    for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
            chrome.runtime.sendMessage(collect_info());
//          observer.disconnect();
            break;
        }
    }
});

observer.observe(document.getElementById("reader"), {"childList": true, "subtree": false});

