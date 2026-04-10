// hiddingChatGPTSection.js

(function () {
    let isActive = false;
    let hiddenMessages = [];
    let placeholder = null;
    let cleanupInterval = null;
    let isBrowsingHistory = false;
    let sectionCountAfterRestore = 0;

    function getSetting(key, defaultValue) {
        if (globalThis.ExtensionSettings && globalThis.ExtensionSettings[key] !== undefined) {
            return globalThis.ExtensionSettings[key];
        }
        return defaultValue;
    }

    function checkChatResumed(container) {
        if (!isBrowsingHistory) return;

        const currentSections = container.querySelectorAll('section');
        // Nếu số lượng section hiện tại lớn hơn số lượng sau khi ta đã khôi phục 
        // -> Có nghĩa là Bot hoặc Người dùng vừa gửi tin nhắn mới
        if (currentSections.length > sectionCountAfterRestore) {
            console.log("[Optimizer] Phát hiện tin nhắn mới. Kết thúc chế độ xem lịch sử.");
            isBrowsingHistory = false;
        }
    }

    function hideOldMessages(container) {
        if (isBrowsingHistory) return;

        const keepCount = getSetting('keepCount', 15);
        const completelyRemove = getSetting('completelyRemove', true);

        const sections = Array.from(container.querySelectorAll('section'));
        if (sections.length > keepCount) {
            const deleteCount = sections.length - keepCount;
            for (let i = 0; i < deleteCount; i++) {
                const section = sections[i];
                const height = section.getBoundingClientRect().height;
                hiddenMessages.push({ node: section, height: height });

                if (completelyRemove) {
                    section.remove();
                } else {
                    section.style.display = 'none';
                }

                let currentHeight = parseFloat(placeholder.style.height) || 0;
                placeholder.style.height = (currentHeight + height) + 'px';
            }
        }
    }

    function manualRestore(n = 5) {
        if (hiddenMessages.length === 0) {
            console.log("[Optimizer] Không còn tin nhắn nào trong bộ nhớ đệm.");
            return;
        }

        const targetSelector = getSetting('chatContainerSelector', '#main div.flex.flex-col.text-sm.pb-25');
        const container = document.querySelector(targetSelector);
        if (!container) return;

        isBrowsingHistory = true;

        for (let i = 0; i < n && hiddenMessages.length > 0; i++) {
            const msgData = hiddenMessages.pop();
            if (!container.contains(msgData.node)) {
                placeholder.after(msgData.node);
            }
            msgData.node.style.display = '';

            let currentHeight = parseFloat(placeholder.style.height) || 0;
            placeholder.style.height = Math.max(0, currentHeight - msgData.height) + 'px';
        }

        const currentVisible = Array.from(container.querySelectorAll('section')).filter(sec => sec.style.display !== 'none');
        sectionCountAfterRestore = currentVisible.length;
        console.log(`[Optimizer] Đã khôi phục tin nhắn. Tạm dừng dọn dẹp cho đến khi có tin nhắn mới.`);
    }

    function start() {
        if (isActive) return true;
        const targetSelector = getSetting('chatContainerSelector', '#main div.flex.flex-col.text-sm.pb-25');
        const container = document.querySelector(targetSelector);
        if (!container) return false;

        placeholder = document.createElement('div');
        placeholder.id = 'extension-scroll-placeholder';
        placeholder.style.height = '0px';
        placeholder.style.flexShrink = '0';
        container.prepend(placeholder);

        cleanupInterval = setInterval(() => {
            checkChatResumed(container);
            hideOldMessages(container);
        }, 3000);

        isActive = true;
        return true;
    }

    function stop() {
        if (!isActive) return;
        const targetSelector = getSetting('chatContainerSelector', '#main div.flex.flex-col.text-sm.pb-25');
        const container = document.querySelector(targetSelector);
        clearInterval(cleanupInterval);
        while (hiddenMessages.length > 0) {
            const msgData = hiddenMessages.pop();
            if (container && !container.contains(msgData.node)) {
                if (placeholder) placeholder.after(msgData.node);
            }
            msgData.node.style.display = '';
        }
        if (placeholder) placeholder.remove();
        isActive = false;
        isBrowsingHistory = false;
    }

    function toggle() {
        if (isActive) {
            stop();
            return "disabled";
        } else {
            const started = start();
            return started ? "enabled" : "blocked_by_setting";
        }
    }

    function getStats() {
        const targetSelector = getSetting('chatContainerSelector', '#main div.flex.flex-col.text-sm.pb-25');
        const container = document.querySelector(targetSelector);

        let visibleCount = 0;
        if (container) {
            const allSections = container.querySelectorAll('section');
            visibleCount = Array.from(allSections).filter(sec => sec.style.display !== 'none').length;
        }
        const hiddenCount = hiddenMessages.length;

        return {
            visible: visibleCount,
            hidden: hiddenCount,
            total: visibleCount + hiddenCount,
            isActive: isActive,
            method: getSetting('completelyRemove', true) ? 'Remove' : 'Hide'
        };
    }

    function manualHide() {
        if (!isActive) return;
        const targetSelector = getSetting('chatContainerSelector', '#main div.flex.flex-col.text-sm.pb-25');
        const container = document.querySelector(targetSelector);
        if (container) {
            const tempFlag = isBrowsingHistory;
            isBrowsingHistory = false;
            hideOldMessages(container);
            isBrowsingHistory = tempFlag;
            console.log("[Optimizer] Đã ép dọn dẹp thủ công.");
        }
    }

    globalThis.HiddingChatGPTSection = {
        start,
        stop,
        manualRestore,
        toggle,
        getStatus: () => isActive,
        getStats,
        manualHide
    };
})();