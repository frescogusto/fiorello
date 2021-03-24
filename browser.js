function isSafari() {
    return typeof navigator !== 'undefined' && navigator.vendor && navigator.vendor.includes('Apple') && navigator.userAgent && !navigator.userAgent.includes('CriOS') && !navigator.userAgent.includes('Chrome') && !navigator.userAgent.includes('FxiOS');
}
function isIOS() {
    return !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
}
function isEdge() {
    return typeof window !== 'undefined' && window.navigator.userAgent.includes('Edge');
}
function isIE() {
    return typeof window !== 'undefined' && (window.navigator.userAgent.includes('MSIE') || window.navigator.userAgent.includes('Trident/'));
}

if (isSafari() || isIOS()) {
    document.body.classList.add('button--fix')
}


document.addEventListener('touchstart', function(e) {
    if(window.innerWidth > window.innerHeight){
        document.querySelector('.landscape').style.display = 'block'
    } else {
        document.querySelector('.landscape').style.display = 'none'
    }
    window.addEventListener("orientationchange", function() {
        if (window.orientation == 0) {
            document.querySelector('.landscape').style.display = 'none'
        } else {
            document.querySelector('.landscape').style.display = 'block'
        }
    }, false);
})