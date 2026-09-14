(function() {
    function initController() {
        const 页面控制器 = document.getElementById('页面控制器');
        const 区块 = document.querySelectorAll('.区块');
        
        if (!页面控制器 || 区块.length === 0) {
            document.addEventListener('DOMContentLoaded', initController);
            return;
        }
        
        const total区块 = 区块.length;
        const 底部提示 = document.getElementById('底部提示');
        
        let currentIndex = 0;
        let isScrolling = false;
        let scrollTimer = null;
        let resizeTimer = null;

        function updateHintVisibility(index) {
            if (底部提示) {
                if (index === 0) {
                    底部提示.style.opacity = '0.6';
                    底部提示.style.pointerEvents = 'none';
                } else {
                    底部提示.style.opacity = '0.15';
                    底部提示.style.pointerEvents = 'none';
                }
            }
        }

        function goToIndex(index) {
            if (isScrolling) return;
            if (index < 0) index = 0;
            if (index >= total区块) index = total区块 - 1;
            if (index === currentIndex) return;
            isScrolling = true;
            currentIndex = index;
            updateHintVisibility(index);

            const blockHeight = window.innerHeight - 24;
            const top = index * (blockHeight + 12);
            页面控制器.scrollTo({ top, behavior: 'smooth' });

            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                isScrolling = false;
                scrollTimer = null;
            }, 600);
        }

        function handleScroll() {
            if (isScrolling) return;
            const scrollTop = 页面控制器.scrollTop;
            const blockHeight = window.innerHeight - 24;
            const totalStep = blockHeight + 12;
            let idx = Math.round(scrollTop / totalStep);
            if (idx < 0) idx = 0;
            if (idx >= total区块) idx = total区块 - 1;

            const snapTop = idx * totalStep;
            if (Math.abs(scrollTop - snapTop) > 10) {
                goToIndex(idx);
            } else if (idx !== currentIndex) {
                currentIndex = idx;
                updateHintVisibility(idx);
            }
        }

        页面控制器.addEventListener('scroll', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                handleScroll();
                resizeTimer = null;
            }, 120);
        }, { passive: true });

        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (!isScrolling) {
                    const blockHeight = window.innerHeight - 24;
                    const totalStep = blockHeight + 12;
                    const top = currentIndex * totalStep;
                    页面控制器.scrollTo({ top, behavior: 'auto' });
                }
                resizeTimer = null;
            }, 200);
        });

        document.addEventListener('keydown', function(e) {
            const key = e.key;
            if (key === 'ArrowDown' || key === 'ArrowRight' || key === 'PageDown') {
                e.preventDefault();
                if (currentIndex < total区块 - 1) goToIndex(currentIndex + 1);
            } else if (key === 'ArrowUp' || key === 'ArrowLeft' || key === 'PageUp') {
                e.preventDefault();
                if (currentIndex > 0) goToIndex(currentIndex - 1);
            } else if (key === 'Home') {
                e.preventDefault();
                goToIndex(0);
            } else if (key === 'End') {
                e.preventDefault();
                goToIndex(total区块 - 1);
            }
        });

        setTimeout(() => {
            页面控制器.scrollTo({ top: 0, behavior: 'auto' });
            currentIndex = 0;
            updateHintVisibility(0);
        }, 50);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initController);
    } else {
        initController();
    }
})();