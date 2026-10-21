(function() {
    var KEY = 'naruto_card_version';
    var current = null;
    
    try { current = localStorage.getItem(KEY); } catch(e) {}
    
    function check() {
        fetch('/version.json?_=' + Date.now(), { cache: 'no-store' })
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (!data || !data.version) return;
                if (current && current !== data.version) {
                    console.log('[AutoUpdate] Nova versao detectada. Atualizando...');
                    try { localStorage.setItem(KEY, data.version); } catch(e) {}
                    setTimeout(function() {
                        window.location.reload(true);
                    }, 500);
                    return;
                }
                if (!current) {
                    try { localStorage.setItem(KEY, data.version); } catch(e) {}
                }
            })
            .catch(function() {});
    }
    
    check();
    setInterval(check, 60000);
})();
