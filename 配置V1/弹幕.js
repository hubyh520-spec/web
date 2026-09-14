    
    function 发送弹幕() {
    const 弹幕输入框 = document.getElementById('弹幕输入框');
    const text = 弹幕输入框.value.trim();
    
    if (text === '') {
        alert('请先输入弹幕');
        return;
    }
    
    const len = Array.from(text).length;
    if (len < 1 || len > 30) {
        alert('弹幕长度不合法');
        return;
    }
    
    const dangerousPattern = /[<>\'""\/\\\\;`]|script|javascript|onerror|onclick|alert|eval|prompt|confirm|document\.|window\.|localStorage/i;
    if (dangerousPattern.test(text)) {
        alert('弹幕包含不允许的字符');
        return;
    }
    
    发送弹幕_MAIN(text);
}

function 发送弹幕_MAIN(content) {
    const 发送按钮 = document.getElementById('发送按钮');
    const 弹幕输入框 = document.getElementById('弹幕输入框');

    const formData = new FormData();
    formData.append('token', 当前Token);
    formData.append('content', content);
    
    if (发送按钮) {
        发送按钮.disabled = true;
        发送按钮.textContent = '发送中';
    }
    
    fetch('Add_弹幕.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('弹幕发送成功');
            if (window.__danmaku) {
                window.__danmaku.addMessage(content);
                setTimeout(() => {
                    window.__danmaku.showNewMessage();
                }, 50);
            }
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        alert('网络错误，请检查连接');
    })
    .finally(() => {
        if (发送按钮) {
            发送按钮.disabled = false;
            发送按钮.textContent = '确定';
        }
        if (弹幕输入框) {
            弹幕输入框.value = '';
        }
    });
}

(function() {
    'use strict';

    let messages = [];
    if (弹幕数据 && 弹幕数据.data && Array.isArray(弹幕数据.data)) {
        messages = 弹幕数据.data.map(item => item.danmaku);
    }
    
    if (messages.length === 0) {
        return;
    }

    const CONFIG = {
        messages: messages,
        fontSize: 15,
        speed: 60,
        opacity: 0.85,
        spawnInterval: 150,
        maxTrackCount: 6,
        topStartPercent: 2,
        topEndPercent: 30,
        horizontalGap: 30,
        currentIndex: 0,
        loopPlay: true,
        isPaused: false,
        totalCreated: 0,
        trackIndex: 0
    };

    let container = document.getElementById('弹幕区块');
    if (!container) {
        container = document.createElement('div');
        container.id = '弹幕区块';
        document.body.appendChild(container);
    }

    container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 9999;
        overflow: hidden;
    `;

    const trackCount = CONFIG.maxTrackCount;
    const tracks = [];
    for (let i = 0; i < trackCount; i++) {
        tracks.push({
            index: i,
            top: CONFIG.topStartPercent + (i / (trackCount - 1)) * (CONFIG.topEndPercent - CONFIG.topStartPercent),
            danmakuList: [],
            locked: false
        });
    }

    let activeDanmaku = [];
    let isRunning = true;
    let spawnTimer = null;
    let animationId = null;
    let lastTimestamp = 0;
    let smoothDelta = 0.016;

    function randomInt(min, max) { 
        return Math.floor(Math.random() * (max - min + 1)) + min; 
    }

    function getNextMessage() {
        if (CONFIG.messages.length === 0) return null;
        
        const msg = CONFIG.messages[CONFIG.currentIndex];
        CONFIG.currentIndex++;
        
        if (CONFIG.currentIndex >= CONFIG.messages.length) {
            if (CONFIG.loopPlay) {
                CONFIG.currentIndex = 0;
            } else {
                CONFIG.currentIndex = CONFIG.messages.length - 1;
            }
        }
        
        return msg;
    }

    function findAvailableTrack() {
        let track = tracks[CONFIG.trackIndex % tracks.length];
        CONFIG.trackIndex++;
        return track;
    }

    function calculateStartPosition(track, width) {
        const viewportWidth = window.innerWidth;
        let lastRightEdge = -Infinity;
        for (const existing of track.danmakuList) {
            if (!existing.isActive || !existing.width) continue;
            const rightEdge = existing.left + existing.width;
            if (rightEdge > lastRightEdge) lastRightEdge = rightEdge;
        }
        if (lastRightEdge === -Infinity || lastRightEdge < viewportWidth) {
            return viewportWidth + randomInt(20, 60);
        }
        return lastRightEdge + CONFIG.horizontalGap;
    }

    function createDanmaku() {
        if (!isRunning || CONFIG.isPaused) return null;
        
        const text = getNextMessage();
        if (!text) return null;
        
        const track = findAvailableTrack();
        if (!track) return null;

        track.locked = true;
        try {
            const el = document.createElement('div');
            el.textContent = text;
            el.style.cssText = `
                position: absolute;
                color: #FFFFFF;
                font-size: ${CONFIG.fontSize}px;
                font-weight: 500;
                font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                letter-spacing: 0.06em;
                opacity: ${CONFIG.opacity};
                white-space: nowrap;
                top: ${track.top}%;
                left: 0px;
                text-shadow: 0 2px 8px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.3);
                z-index: 1;
                pointer-events: none;
                will-change: transform;
            `;
            container.appendChild(el);

            const width = el.offsetWidth || 200;
            const left = calculateStartPosition(track, width);
            el.style.transform = 'translateX(' + left + 'px)';

            const data = {
                element: el,
                track: track,
                left: left,
                width: width,
                isActive: true,
                text: text
            };

            CONFIG.totalCreated++;
            track.danmakuList.push(data);
            track.danmakuList.sort((a, b) => a.left - b.left);
            activeDanmaku.push(data);
            
            return data;
        } finally {
            track.locked = false;
        }
    }

    function showNewMessage() {
        if (CONFIG.messages.length === 0) return;
        CONFIG.currentIndex = CONFIG.messages.length - 1;
        createDanmaku();
    }

    function animate(timestamp) {
        if (!isRunning) {
            animationId = requestAnimationFrame(animate);
            return;
        }

        if (CONFIG.isPaused) {
            animationId = requestAnimationFrame(animate);
            return;
        }

        if (lastTimestamp === 0) {
            lastTimestamp = timestamp;
            animationId = requestAnimationFrame(animate);
            return;
        }

        let rawDelta = (timestamp - lastTimestamp) / 1000;
        lastTimestamp = timestamp;

        if (rawDelta > 0.05) rawDelta = 0.05;
        if (rawDelta < 0.001) rawDelta = 0.001;

        const alpha = 0.3;
        smoothDelta = smoothDelta * (1 - alpha) + rawDelta * alpha;

        const moveDistance = CONFIG.speed * smoothDelta;

        for (let i = activeDanmaku.length - 1; i >= 0; i--) {
            const data = activeDanmaku[i];

            if (!data.isActive || !data.element || !data.element.parentNode) {
                if (data.element && data.element.parentNode) {
                    data.element.remove();
                }
                if (data.track) {
                    data.track.danmakuList = data.track.danmakuList.filter(d => d !== data);
                }
                activeDanmaku.splice(i, 1);
                continue;
            }

            const currentWidth = data.element.offsetWidth;
            if (currentWidth > 0 && currentWidth !== data.width) {
                data.width = currentWidth;
            }

            data.left -= moveDistance;
            data.element.style.transform = 'translateX(' + data.left + 'px)';

            if (data.left + data.width < -50) {
                data.isActive = false;
                if (data.element.parentNode) data.element.remove();
                if (data.track) data.track.danmakuList = data.track.danmakuList.filter(d => d !== data);
                activeDanmaku.splice(i, 1);
            }
        }

        animationId = requestAnimationFrame(animate);
    }

    function startSpawning() {
        if (spawnTimer) clearInterval(spawnTimer);
        spawnTimer = setInterval(function() {
            if (!isRunning || CONFIG.isPaused) { 
                return; 
            }
            if (!CONFIG.loopPlay && CONFIG.currentIndex >= CONFIG.messages.length - 1) {
                clearInterval(spawnTimer);
                spawnTimer = null;
                return;
            }
            if (Math.random() < 0.6) {
                createDanmaku();
            }
        }, CONFIG.spawnInterval);
    }

    function handleResize() {
        const viewportWidth = window.innerWidth;
        for (const data of activeDanmaku) {
            if (!data.isActive) continue;
            if (data.left > viewportWidth + 50) {
                data.left = viewportWidth + randomInt(20, 60);
                data.element.style.transform = 'translateX(' + data.left + 'px)';
            }
        }
    }

    function init() {
        CONFIG.currentIndex = 0;
        CONFIG.isPaused = false;
        CONFIG.totalCreated = 0;
        CONFIG.trackIndex = 0;
        
        container.innerHTML = '';
        activeDanmaku = [];
        for (const track of tracks) {
            track.danmakuList = [];
            track.locked = false;
        }

        smoothDelta = 0.016;
        lastTimestamp = 0;

        for (let i = 0; i < trackCount; i++) {
            setTimeout(function() { createDanmaku(); }, i * 200);
        }

        if (animationId) cancelAnimationFrame(animationId);
        animationId = requestAnimationFrame(animate);

        startSpawning();
        window.addEventListener('resize', handleResize);
    }

    function destroy() {
        isRunning = false;
        if (spawnTimer) clearInterval(spawnTimer);
        if (animationId) cancelAnimationFrame(animationId);
        container.innerHTML = '';
        activeDanmaku = [];
        for (const track of tracks) {
            track.danmakuList = [];
            track.locked = false;
        }
    }

    function addMessage(msg) {
        if (msg && typeof msg === 'string') {
            CONFIG.messages.push(msg);
        }
    }

    function resetPlay() {
        CONFIG.currentIndex = 0;
        CONFIG.totalCreated = 0;
        CONFIG.trackIndex = 0;
        for (const data of activeDanmaku) {
            if (data.element && data.element.parentNode) {
                data.element.remove();
            }
        }
        activeDanmaku = [];
        for (const track of tracks) {
            track.danmakuList = [];
        }
        setTimeout(() => {
            for (let i = 0; i < trackCount; i++) {
                setTimeout(() => { createDanmaku(); }, i * 200);
            }
        }, 500);
    }

    window.__danmaku = {
        init: init,
        destroy: destroy,
        setSpeed: function(speed) { CONFIG.speed = speed; },
        setFontSize: function(size) {
            CONFIG.fontSize = size;
            for (const data of activeDanmaku) {
                data.element.style.fontSize = size + 'px';
                data.width = data.element.offsetWidth || 200;
            }
        },
        getStatus: function() {
            return {
                activeCount: activeDanmaku.length,
                totalCreated: CONFIG.totalCreated,
                speed: CONFIG.speed + ' px/s',
                fontSize: CONFIG.fontSize + 'px',
                currentIndex: CONFIG.currentIndex,
                totalMessages: CONFIG.messages.length,
                loopPlay: CONFIG.loopPlay,
                isPaused: CONFIG.isPaused,
                remaining: CONFIG.messages.length - CONFIG.currentIndex,
                firstMessage: CONFIG.messages[0] || '无',
                lastMessage: CONFIG.messages[CONFIG.messages.length - 1] || '无'
            };
        },
        forceCreate: createDanmaku,
        addMessage: addMessage,
        showNewMessage: showNewMessage,
        setLoop: function(loop) { CONFIG.loopPlay = loop; },
        resetPlay: resetPlay,
        pause: function() { CONFIG.isPaused = true; },
        resume: function() { CONFIG.isPaused = false; },
        getMessages: function() { return CONFIG.messages.slice(); },
        clearAll: function() {
            for (const data of activeDanmaku) {
                if (data.element && data.element.parentNode) {
                    data.element.remove();
                }
            }
            activeDanmaku = [];
            for (const track of tracks) {
                track.danmakuList = [];
            }
        }
    };

    document.addEventListener('DOMContentLoaded', init);

})();
